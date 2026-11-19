import { Link } from "react-router-dom";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__copy">

  <span className="hero__eyebrow">
    Queue Management System
  </span>

  <div className="hero__content">

    <div className="hero__left">

      <h1 className="hero__title">
        Walk in.
        <br />
        Take a token.
        <br />
        <span className="hero__title-accent">
          Watch it move.
        </span>
      </h1>

    </div>

    <div className="hero__right">

      <p className="hero__desc">
        QueueSync is an IoT-enabled queue management platform
        that allows customers to book tokens remotely,
        monitor live queue status, and receive real-time
        updates. It helps reduce waiting time and improves
        the overall banking experience for both customers
        and staff.
      </p>

    </div>

  </div>

</div>

      </div>
    </section>
  );
}
