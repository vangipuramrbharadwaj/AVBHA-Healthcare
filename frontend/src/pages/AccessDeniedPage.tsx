import { Link } from "react-router-dom";
export function AccessDeniedPage(){return <div className="center-message"><span className="error-code">403</span><h1>Access denied</h1><p>Your account does not have permission to open this area.</p><Link className="button button-primary" to="/">Return to dashboard</Link></div>}
