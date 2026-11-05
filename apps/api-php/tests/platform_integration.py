"""M20–M25 isolated MySQL HTTP regression: no Cloudways credentials or real providers."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
import os
import secrets
import socket
import subprocess
import time
import unittest
import urllib.request
from pathlib import Path

from production_integration import Client

ROOT=Path(__file__).resolve().parents[1]
PASSWORD='CI-Platform-'+secrets.token_hex(12)

class PlatformFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if '_test' not in os.environ.get('KRISHIGO_DB_DSN',''):
            raise unittest.SkipTest('Production platform tests require an isolated _test MySQL database')
        cls.env=dict(os.environ,KRISHIGO_API_MODE='production',KRISHIGO_ALLOW_HTTP_LOCAL='1',
            KRISHIGO_TEST_ADMIN_PASSWORD=PASSWORD)
        subprocess.run(['php',str(ROOT/'tests/init_production_database.php')],env=cls.env,check=True,stdout=subprocess.PIPE)
        with socket.socket() as sock:sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1]
        cls.base=f'http://127.0.0.1:{cls.port}'
        cls.server=subprocess.Popen(['php','-S',f'127.0.0.1:{cls.port}','-t',str(ROOT/'public'),str(ROOT/'public/index.php')],
            env=cls.env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        for _ in range(90):
            try:
                urllib.request.urlopen(cls.base+'/healthz',timeout=.3).close()
                break
            except Exception:time.sleep(.1)
        else:raise RuntimeError('PHP production platform server not ready')
    @classmethod
    def tearDownClass(cls):
        cls.server.terminate();cls.server.wait(timeout=5)
    def setUp(self):
        self.admin=Client(self.base);self.admin.prepare()
        self.editor=Client(self.base);self.editor.prepare()
        self.assertEqual(self.admin.login('admin@krishigo.test',PASSWORD)[0],200)
        self.assertEqual(self.editor.login('editor@krishigo.test',PASSWORD)[0],200)
    def test_knowledge_source_snapshot_and_supersession(self):
        public=Client(self.base)
        st,cap=public.call('GET','/api/v1/platform/capabilities')
        self.assertEqual(st,200)
        for key in ['generative_ai','payments','registered_pesticide_catalogue','whatsapp_delivery']:
            self.assertFalse(cap[key])
        st,empty=public.call('GET','/api/v1/knowledge/articles')
        self.assertEqual(st,200);self.assertEqual(empty['items'],[])
        source=dict(title='TNAU educational crop reference',publisher='TNAU',
                    source_url='https://agritech.tnau.ac.in/crop_protection/crop_prot.html',
                    jurisdiction='India',published_on='2023-01-01')
        st,new=self.editor.call('POST','/api/v1/editor/knowledge/sources',source)
        self.assertEqual(st,201,new);sid=new['id']
        st,_=self.editor.call('POST',f'/api/v1/editor/knowledge/sources/{sid}/review',
                              {'decision':'approve','reason':'Author cannot independently certify source'})
        self.assertEqual(st,409)
        st,approved=self.admin.call('POST',f'/api/v1/editor/knowledge/sources/{sid}/review',
            {'decision':'approve','reason':'Checked cited educational source reference for test'})
        self.assertEqual(st,200,approved);self.assertFalse(approved['external_source_authorization'])
        st,_=self.admin.call('POST',f'/api/v1/editor/knowledge/sources/{sid}/review',
            {'decision':'approve','reason':'Try to re-review an approved source'})
        self.assertEqual(st,409)
        st,sources=public.call('GET','/api/v1/knowledge/sources')
        self.assertEqual(st,200);self.assertEqual(len(sources['items']),1)
        entry=dict(source_id=sid,title='Example crop observation',
            crop='Onion',topic='crop_guide',language='en',
            summary='This educational summary explains field observation, visible symptoms and source limitations; it contains no chemical dose.')
        st,draft=self.editor.call('POST','/api/v1/editor/knowledge/articles',entry)
        self.assertEqual(st,201,draft);self.assertEqual(draft['revision'],1)
        st,empty=public.call('GET','/api/v1/knowledge/articles')
        self.assertEqual(len(empty['items']),0)
        st,reviewed=self.admin.call('POST',f"/api/v1/editor/knowledge/articles/{draft['id']}/review",
            {'decision':'approve','reason':'Independent review of training summary and source'})
        self.assertEqual(st,200,reviewed);self.assertFalse(reviewed['agronomist_certified'])
        st,listed=public.call('GET','/api/v1/knowledge/articles?language=en&crop=Onion')
        self.assertEqual(st,200);self.assertEqual(len(listed['items']),1)
        self.assertEqual(listed['items'][0]['source_url'],source['source_url'])
        st,rev=self.editor.call('POST','/api/v1/editor/knowledge/articles',{**entry,'supersedes_id':draft['id'],
            'title':'Example crop observation revised'})
        self.assertEqual(st,201,rev);self.assertEqual(rev['revision'],2)
        st,_=self.admin.call('POST',f"/api/v1/editor/knowledge/articles/{rev['id']}/review",
            {'decision':'approve','reason':'New revision adds clear crop context and source'})
        self.assertEqual(st,200)
        st,listed=public.call('GET','/api/v1/knowledge/articles?language=en&crop=Onion')
        self.assertEqual(len(listed['items']),1);self.assertEqual(listed['items'][0]['revision'],2)
        st,old=public.call('GET',f"/api/v1/knowledge/articles/{draft['id']}")
        self.assertEqual(st,404)
        now=datetime.now(timezone.utc).date()
        data=dict(domain='mandi',label='Illustrative manual source observation',source_id=sid,
            observed_on=now.isoformat(),valid_until=(now+timedelta(days=3)).isoformat(),
            payload={'commodity':'Onion','market':'Sample market','rate_inr':1000})
        st,snapshot=self.editor.call('POST','/api/v1/editor/data/snapshots',data)
        self.assertEqual(st,201,snapshot)
        st,public_data=public.call('GET','/api/v1/data/snapshots?domain=mandi')
        self.assertEqual(st,200);self.assertEqual(public_data['items'],[])
        st,_=self.admin.call('POST',f"/api/v1/editor/data/snapshots/{snapshot['id']}/review",
            {'decision':'approve','reason':'Manually reviewed source and measurement context'})
        self.assertEqual(st,200)
        st,public_data=public.call('GET','/api/v1/data/snapshots?domain=mandi')
        self.assertEqual(st,200);self.assertEqual(len(public_data['items']),1)
        self.assertFalse(public_data['connector_live'])
        st,ai=public.call('GET','/api/v1/assistant/search?q=Onion')
        self.assertEqual(st,200);self.assertFalse(ai['generative_ai'])
        self.assertGreaterEqual(len(ai['matches']),1)
        self.assertEqual(ai['matches'][0]['source_url'],source['source_url'])
        st,_=public.call('POST','/api/v1/editor/knowledge/sources',source,csrf=False)
        self.assertEqual(st,401) # Anonymous authorization rejected before CSRF validation.
        st,_=self.editor.call('POST','/api/v1/editor/knowledge/sources',source,
                              csrf=False,extra={'X-CSRF-Token':'wrong'})
        self.assertEqual(st,419)
        st,_=self.editor.call('POST','/api/v1/editor/knowledge/sources',{**source,'source_url':'http://example.com'})
        self.assertEqual(st,422)

    def test_farm_trade_review_notifications_and_agronomy(self):
        farmer=Client(self.base);farmer.prepare()
        buyer=Client(self.base);buyer.prepare()
        st,_=farmer.register('grower@platform.test','farmer');self.assertEqual(st,201)
        st,_=buyer.register('buyer@platform.test','buyer');self.assertEqual(st,201)
        self.assertEqual(farmer.login('grower@platform.test')[0],200)
        self.assertEqual(buyer.login('buyer@platform.test')[0],200)
        st,_=farmer.call('PUT','/api/v1/me/farm-profile',{'district':'Pune','crop_focus':'Tomato',
            'preferred_language':'mr'})
        self.assertEqual(st,200)
        st,profile=farmer.call('GET','/api/v1/me/farm-profile')
        self.assertEqual(profile['profile']['preferred_language'],'mr')
        st,not_visible=buyer.call('GET','/api/v1/me/farm-profile')
        self.assertIsNone(not_visible['profile'])
        st,_=farmer.call('POST','/api/v1/suppliers/profile',{'business_name':'Test grower',
            'district':'Pune','license_reference':'Unverified example'})
        self.assertEqual(st,403)
        for person in [farmer,buyer]:
            st,who=person.call('GET','/api/v1/auth/me')
            user_id=who['identity']['id']
            st,_=self.admin.call('POST',f'/api/v1/admin/users/{user_id}/verify',
                {'reason':'Verified identity for isolated HTTP integration'})
            self.assertEqual(st,200)
        st,supplier=farmer.call('POST','/api/v1/suppliers/profile',{'business_name':'Test grower',
            'district':'Pune','license_reference':'Unverified example'})
        self.assertEqual(st,201)
        st,pending=self.admin.call('GET','/api/v1/admin/suppliers')
        self.assertEqual(st,200);self.assertEqual(len(pending['items']),1)
        st,decision=self.admin.call('POST',f"/api/v1/admin/suppliers/{supplier['id']}/review",
            {'decision':'approve','reason':'Test review, without legal license validation'})
        self.assertEqual(st,200);self.assertFalse(decision['regulatory_licence_verified'])
        st,_=buyer.call('PUT','/api/v1/me/notification-preferences',
              {'topic':'trade','channel':'in_app','opted_in':True})
        self.assertEqual(st,200)
        st,_=farmer.call('PUT','/api/v1/me/notification-preferences',
              {'topic':'trade','channel':'in_app','opted_in':True})
        self.assertEqual(st,200)
        st,lot=farmer.call('POST','/api/v1/marketplace/listings',
          {'crop':'Onion','district':'Pune','quantity_kg':1000,'price_per_kg':25,'description':'Educational staged listing'})
        self.assertEqual(st,201)
        st,_=self.admin.call('POST',f"/api/v1/admin/review-cases/listing/{lot['id']}/decision",
            {'decision':'approve','reason':'Verified farmer test lot in test database'})
        self.assertEqual(st,200)
        st,enquiry=buyer.call('POST','/api/v1/enquiries',
          {'listing_id':lot['id'],'quantity_kg':400,'message':'Please share an example quotation'})
        self.assertEqual(st,201)
        expires=(datetime.now(timezone.utc).date()+timedelta(days=3)).isoformat()
        st,quote=farmer.call('POST','/api/v1/trade/quotes',
          {'enquiry_id':enquiry['id'],'total_inr':9000,'terms':'Illustrative pickup and packing terms only','expires_on':expires})
        self.assertEqual(st,201,quote);self.assertFalse(quote['payment_requested'])
        st,dupe=farmer.call('POST','/api/v1/trade/quotes',
          {'enquiry_id':enquiry['id'],'total_inr':9000,'terms':'Illustrative pickup and packing terms only','expires_on':expires})
        self.assertEqual(st,409)
        st,buyer_events=buyer.call('GET','/api/v1/me/notification-events')
        self.assertEqual(st,200);self.assertEqual(len(buyer_events['items']),1)
        st,_=farmer.call('POST',f"/api/v1/trade/quotes/{quote['id']}/decision",{'decision':'accept'})
        self.assertEqual(st,403)
        st,accepted=buyer.call('POST',f"/api/v1/trade/quotes/{quote['id']}/decision",{'decision':'accept'})
        self.assertEqual(st,200,accepted);self.assertFalse(accepted['payment_enabled'])
        st,orders=farmer.call('GET','/api/v1/trade/orders/mine')
        self.assertEqual(st,200);self.assertEqual(len(orders['items']),1)
        st,confirm=farmer.call('POST',f"/api/v1/trade/orders/{accepted['order_id']}/confirm",{})
        self.assertEqual(st,200,confirm);self.assertFalse(confirm['shipping_enabled'])
        st,_=farmer.call('POST',f"/api/v1/trade/orders/{accepted['order_id']}/confirm",{})
        self.assertEqual(st,409)
        st,_=buyer.call('PUT','/api/v1/me/notification-preferences',
            {'topic':'trade','channel':'in_app','opted_in':False})
        self.assertEqual(st,200)
        st,consent=buyer.call('GET','/api/v1/me/notification-preferences')
        self.assertEqual(st,200);self.assertEqual(int(consent['items'][0]['opted_in']),0)
        st,intake=farmer.call('POST','/api/v1/agronomy/intake',{'kind':'label_transcription',
            'crop':'Tomato','observation':'Text transcribed by user, not yet validated',
            'context_note':'Example label for manual review, no OCR'})
        self.assertEqual(st,201);self.assertFalse(intake['ocr_processed'])
        st,private=farmer.call('GET','/api/v1/agronomy/mine')
        self.assertEqual(len(private['items']),1)
        st,other=buyer.call('GET','/api/v1/agronomy/mine')
        self.assertEqual(other['items'],[])


    def test_m26_complete_journey_cancellation_and_stock_reservations(self):
        seed=secrets.token_hex(4)
        farmer=Client(self.base);farmer.prepare()
        buyer1=Client(self.base);buyer1.prepare()
        buyer2=Client(self.base);buyer2.prepare()
        stranger=self.admin # Already authenticated and staff-reviewed, but NOT a participant.
        users=[(farmer,'farmer'),(buyer1,'buyer'),(buyer2,'buyer')]
        for index,(client,role) in enumerate(users):
            email=f'm26-{seed}-{index}@krishigo.test'
            code,_=client.register(email,role);self.assertEqual(code,201)
            code,_=client.login(email);self.assertEqual(code,200)
            code,who=client.call('GET','/api/v1/auth/me')
            self.assertEqual(code,200)
            if client is not stranger:
                code,verified=self.admin.call('POST',f"/api/v1/admin/users/{who['identity']['id']}/verify",
                     {'reason':'Staff-reviewed test identity for the M26 isolated journey'})
                self.assertEqual(code,200,verified)
        code,created=farmer.call('POST','/api/v1/marketplace/listings',
            {'crop':'Onion','district':'Pune','quantity_kg':500,'price_per_kg':25,
             'description':'Sample harvest lot reserved only within the test system'})
        self.assertEqual(code,201,created)
        lid=created['id']
        code,reviewed=self.admin.call('POST',f'/api/v1/admin/review-cases/listing/{lid}/decision',
            {'decision':'approve','reason':'Independent test listing approval and crop details'})
        self.assertEqual(code,200,reviewed)
        code,dashboard=buyer1.call('GET','/api/v1/trade/dashboard')
        self.assertEqual(code,200)
        self.assertTrue(any(x['id']==lid for x in dashboard['published_listings']))
        self.assertEqual(dashboard['enquiries'],[])
        self.assertFalse(dashboard['payments_enabled'])
        code,own=farmer.call('GET','/api/v1/trade/dashboard')
        self.assertEqual(code,200)
        self.assertTrue(any(x['id']==lid for x in own['my_listings']))
        enquiries=[]
        for buyer,qty in [(buyer1,350),(buyer2,300)]:
            code,item=buyer.call('POST','/api/v1/enquiries',
                {'listing_id':lid,'quantity_kg':qty,'message':'Request a clear draft quotation for this lot'})
            self.assertEqual(code,201,item)
            enquiries.append(item['id'])
        code,farmer_view=farmer.call('GET','/api/v1/trade/dashboard')
        self.assertEqual(code,200)
        self.assertEqual(len([e for e in farmer_view['enquiries'] if e['listing_id']==lid]),2)
        code,view=buyer1.call('GET','/api/v1/trade/dashboard')
        self.assertEqual(code,200)
        self.assertEqual(len([e for e in view['enquiries'] if e['listing_id']==lid]),1)
        code,other=stranger.call('GET','/api/v1/trade/dashboard')
        self.assertEqual(code,200)
        self.assertEqual(len([e for e in other['enquiries'] if e['listing_id']==lid]),0)
        expires=(datetime.now(timezone.utc).date()+timedelta(days=7)).isoformat()
        quotes=[]
        for eid in enquiries:
            code,quote=farmer.call('POST','/api/v1/trade/quotes',
                {'enquiry_id':eid,'total_inr':10000,
                 'terms':'Provisional local pickup terms; no committed delivery', 'expires_on':expires})
            self.assertEqual(code,201,quote)
            quotes.append(quote['id'])
        code,nonparticipant=stranger.call('POST',f'/api/v1/trade/quotes/{quotes[0]}/decision',{'decision':'accept'})
        self.assertEqual(code,403)
        code,a=buyer1.call('POST',f'/api/v1/trade/quotes/{quotes[0]}/decision',{'decision':'accept'})
        self.assertEqual(code,200,a)
        first_order=a['order_id'];self.assertFalse(a['payment_enabled'])
        code,blocked=buyer2.call('POST',f'/api/v1/trade/quotes/{quotes[1]}/decision',{'decision':'accept'})
        self.assertEqual(code,409,blocked)
        self.assertEqual(blocked['error'],'lot_quantity_already_reserved')
        code,timeline=buyer1.call('GET',f'/api/v1/trade/orders/{first_order}/timeline')
        self.assertEqual(code,200,timeline)
        kinds=[x['event_type'] for x in timeline['events']]
        self.assertIn('listing_created',kinds)
        self.assertIn('enquiry_submitted',kinds)
        self.assertIn('quote_offered',kinds)
        self.assertIn('quote_accepted',kinds)
        self.assertFalse(timeline['external_fulfilment'])
        code,_=stranger.call('GET',f'/api/v1/trade/orders/{first_order}/timeline')
        self.assertEqual(code,404)
        code,_=stranger.call('POST',f'/api/v1/trade/orders/{first_order}/cancel',
            {'reason':'I should not be allowed to cancel this order'})
        self.assertEqual(code,404) # verified admin has no participant override
        code,_=buyer1.call('POST',f'/api/v1/trade/orders/{first_order}/cancel',
            {'reason':'Expected cancellation blocked by missing CSRF'},
            csrf=False,extra={'X-CSRF-Token':'wrong'})
        self.assertEqual(code,419)
        code,cancelled=buyer1.call('POST',f'/api/v1/trade/orders/{first_order}/cancel',
            {'reason':'Internal test buyer cancellation, no goods shipped'})
        self.assertEqual(code,200,cancelled)
        self.assertTrue(cancelled['reservation_released'])
        self.assertEqual(cancelled['status'],'cancelled_by_buyer')
        code,_=buyer1.call('POST',f'/api/v1/trade/orders/{first_order}/cancel',
            {'reason':'Duplicate buyer cancellation should be rejected'})
        self.assertEqual(code,409)
        code,updated=buyer1.call('GET',f'/api/v1/trade/orders/{first_order}/timeline')
        self.assertEqual(code,200)
        self.assertIn('order_cancelled',[x['event_type'] for x in updated['events']])
        code,next_order=buyer2.call('POST',f'/api/v1/trade/quotes/{quotes[1]}/decision',
            {'decision':'accept'})
        self.assertEqual(code,200,next_order)
        second_order=next_order['order_id']
        code,confirm=farmer.call('POST',f'/api/v1/trade/orders/{second_order}/confirm',{})
        self.assertEqual(code,200,confirm)
        self.assertEqual(confirm['status'],'confirmed_record')
        code,history=farmer.call('GET',f'/api/v1/trade/orders/{second_order}/timeline')
        self.assertEqual(code,200)
        self.assertIn('seller_confirmed',[x['event_type'] for x in history['events']])
        code,cancelled=farmer.call('POST',f'/api/v1/trade/orders/{second_order}/cancel',
            {'reason':'Test seller cancellation prior to any external fulfilment'})
        self.assertEqual(code,200,cancelled)
        self.assertEqual(cancelled['status'],'cancelled_by_seller')
        self.assertFalse(cancelled['payments_enabled'])
        code,orders=farmer.call('GET','/api/v1/trade/dashboard')
        self.assertEqual(code,200)
        states={x['id']:x['status'] for x in orders['orders']}
        self.assertEqual(states[first_order],'cancelled_by_buyer')
        self.assertEqual(states[second_order],'cancelled_by_seller')


    def test_m28_production_policy_and_private_plot_ownership(self):
        # Separate logical account from existing staff/farmer fixtures. No new IP
        # registrations: production's five/hour registration throttle stays intact.
        grower=Client(self.base);grower.prepare()
        self.assertEqual(grower.login('grower@platform.test')[0],200)
        st,initial=self.admin.call('GET','/api/v1/platform/modules')
        self.assertEqual(st,200,initial)
        self.assertTrue(initial['controls_server_enforced'])
        self.assertEqual(len(initial['items']),25)
        def module(snapshot,id):
            return next(x for x in snapshot['items'] if x['module_id']==id)
        revision=module(initial,2)['revision']
        st,_=self.editor.call('PUT','/api/v1/admin/platform/modules/2',
            {'enabled':False,'expected_revision':revision})
        self.assertEqual(st,403)
        st,_=self.admin.call('PUT','/api/v1/admin/platform/modules/2',
            {'enabled':False,'expected_revision':revision+900})
        self.assertEqual(st,409)
        st,off=self.admin.call('PUT','/api/v1/admin/platform/modules/2',
            {'enabled':False,'expected_revision':revision})
        self.assertEqual(st,200,off)
        self.assertEqual(set(off['changed']),{2,3,24})
        st,flags=self.admin.call('GET','/api/v1/platform/modules')
        self.assertEqual(st,200)
        for x in [2,3,24]:self.assertFalse(module(flags,x)['enabled'])
        st,blocked=grower.call('GET','/api/v1/marketplace/listings')
        self.assertEqual(st,404,blocked)
        self.assertEqual(blocked['error'],'module_disabled')
        st,_=self.admin.call('GET','/api/v1/buyers/requirements')
        self.assertEqual(st,404)
        st,_=self.admin.call('GET','/api/v1/knowledge/articles')
        self.assertEqual(st,200)
        st,blocked=self.admin.call('PUT','/api/v1/admin/platform/modules/3',
            {'enabled':True,'expected_revision':module(flags,3)['revision']})
        self.assertEqual(st,409,blocked)
        self.assertEqual(blocked['error'],'dependency_required')
        st,_=self.admin.call('PUT','/api/v1/admin/platform/modules/2',
            {'enabled':True,'expected_revision':module(flags,2)['revision']})
        self.assertEqual(st,200)
        st,restored=self.admin.call('GET','/api/v1/platform/modules')
        self.assertEqual(st,200)
        for x in [3,24]:
            st,_=self.admin.call('PUT',f'/api/v1/admin/platform/modules/{x}',
                {'enabled':True,'expected_revision':module(restored,x)['revision']})
            self.assertEqual(st,200)
        st,restored=self.admin.call('GET','/api/v1/platform/modules')
        self.assertEqual(st,200)
        self.assertTrue(all(module(restored,x)['enabled'] for x in [2,3,24]))
        st,entry=grower.call('POST','/api/v1/me/fields',{
            'field_name':'Northern Onion Plot','district':'Pune','village':'Sample village',
            'crop':'Onion','area_hectares':'1.75'})
        self.assertEqual(st,201,entry)
        fid=entry['id'];self.assertEqual(entry['revision'],1)
        st,_=self.admin.call('GET',f'/api/v1/me/fields/{fid}')
        self.assertEqual(st,404)
        st,_=self.editor.call('GET','/api/v1/me/fields')
        self.assertEqual(st,403)
        st,fields=grower.call('GET','/api/v1/me/fields')
        self.assertEqual(st,200)
        self.assertTrue(fields['owner_scoped'])
        self.assertTrue(any(f['id']==fid for f in fields['items']))
        case_payload={'crop':'Onion','kind':'plant_observation',
             'observation':'Initial signs of leaf curl in this owned crop plot',
             'context_note':'Recorded by a farmer before any expert review',
             'field_id':fid}
        st,linked=grower.call('POST','/api/v1/agronomy/intake',case_payload)
        self.assertEqual(st,201,linked)
        self.assertEqual(linked['field_id'],fid)
        st,history=grower.call('GET','/api/v1/agronomy/mine')
        self.assertEqual(st,200)
        self.assertTrue(any(x['id']==linked['id'] and x['field_id']==fid for x in history['items']))
        st,_=self.admin.call('POST','/api/v1/agronomy/intake',case_payload)
        self.assertEqual(st,404) # no field access despite staff role
        st,_=grower.call('PATCH',f'/api/v1/me/fields/{fid}',
            {'expected_revision':1,'crop':'Soybean'},csrf=False,extra={'X-CSRF-Token':'wrong'})
        self.assertEqual(st,419)
        st,changed=grower.call('PATCH',f'/api/v1/me/fields/{fid}',
            {'expected_revision':1,'crop':'Soybean'})
        self.assertEqual(st,200,changed)
        self.assertEqual(changed['revision'],2)
        st,_=grower.call('PATCH',f'/api/v1/me/fields/{fid}',
            {'expected_revision':1,'crop':'Cotton'})
        self.assertEqual(st,409)
        st,profile=grower.call('GET',f'/api/v1/me/fields/{fid}')
        self.assertEqual(st,200)
        self.assertEqual(profile['field']['crop'],'Soybean')
        st,archived=grower.call('PATCH',f'/api/v1/me/fields/{fid}',
            {'expected_revision':2,'status':'archived'})
        self.assertEqual(st,200,archived)
        st,_=grower.call('PATCH',f'/api/v1/me/fields/{fid}',
            {'expected_revision':3,'crop':'Cotton'})
        self.assertEqual(st,409)
        st,_=grower.call('POST','/api/v1/agronomy/intake',case_payload)
        self.assertEqual(st,404) # archived plot cannot receive new cases
        st,public=self.admin.call('GET','/api/v1/me/fields')
        self.assertEqual(st,200)
        self.assertEqual(public['items'],[])

if __name__=='__main__':
    unittest.main()
