import { Admin } from "./pages/Admin";
import { Donate } from "./pages/Donate";
import { Done } from "./pages/Done";
import { Home } from "./pages/Home";
import { Order } from "./pages/Order";
import { Link, usePath } from "./router";

export function App() {
  const path = usePath().replace(/\/+$/, "") || "/";
  if (path === "/") return <Home />;
  if (path === "/donate") return <Donate />;
  if (path === "/order") return <Order />;
  const done = path.match(/^\/order\/(BXB-[A-Z0-9]+)$/);
  if (done) return <Done code={done[1]} />;
  if (path === "/admin") return <Admin />;
  return (
    <main className="page section stack gap-14" style={{ paddingTop: 80, textAlign: "center" }}>
      <h1 className="h1 sm">This balloon floated away</h1>
      <Link href="/" className="btn btn-ink">Back to home</Link>
    </main>
  );
}
