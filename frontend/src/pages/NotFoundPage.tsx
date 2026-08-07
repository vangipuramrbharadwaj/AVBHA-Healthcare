import { Link } from "react-router-dom";
export function NotFoundPage(){return <div className="center-message"><span className="error-code">404</span><h1>Page not found</h1><p>The requested AVBHA page does not exist.</p><Link className="button button-primary" to="/">Return to dashboard</Link></div>}
