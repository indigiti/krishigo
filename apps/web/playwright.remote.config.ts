import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',testMatch:['remote-staging.spec.ts'],retries:0,
 timeout:45000,use:{baseURL:'https://stage.digiti.in',trace:'retain-on-failure'},
 projects:[{name:'remote-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
           {name:'remote-mobile',use:{...devices['Desktop Chrome'],viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});
