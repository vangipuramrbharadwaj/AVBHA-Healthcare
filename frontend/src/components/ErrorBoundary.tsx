import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<{children:ReactNode},{hasError:boolean}> {
  state={hasError:false};
  static getDerivedStateFromError(){return{hasError:true};}
  componentDidCatch(error:Error,info:ErrorInfo){console.error("Frontend error boundary",error,info);}
  render(){if(this.state.hasError)return <div className="fatal-error"><h1>Something went wrong</h1><p>The application encountered an unexpected error.</p><button className="button button-primary" onClick={()=>window.location.reload()}>Reload application</button></div>;return this.props.children;}
}
