import {Component,type ReactNode,type ErrorInfo} from 'react';
import {diagnostics} from '../infrastructure/diagnostics';
type Props={area:string;children:ReactNode};
type State={failed:boolean;revision:number};
export class WorkspaceBoundary extends Component<Props,State>{
 state:State={failed:false,revision:0};
 static getDerivedStateFromError():Partial<State>{return {failed:true};}
 componentDidCatch(_error:Error,_info:ErrorInfo){diagnostics.record('workspace_render_failure',this.props.area);}
 componentDidUpdate(previous:Props){if(previous.area!==this.props.area&&this.state.failed)this.setState({failed:false});}
 render(){return this.state.failed?
 <section className="surface-card workspace-recovery" role="alert"><h2>Workspace temporarily unavailable</h2><p>Other modules remain available. Retrying does not replay transactions.</p><button className="btn btn-primary" onClick={()=>this.setState(v=>({failed:false,revision:v.revision+1}))}>Retry workspace</button></section>
 :<div key={this.props.area+':'+this.state.revision}>{this.props.children}</div>;}
}
