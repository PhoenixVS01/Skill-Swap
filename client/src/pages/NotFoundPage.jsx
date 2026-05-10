import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <section className="container not-found">
      <article className="card">
        <h2>Page Not Found</h2>
        <p>The page you requested does not exist.</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </article>
    </section>
  );
};

export default NotFoundPage;
