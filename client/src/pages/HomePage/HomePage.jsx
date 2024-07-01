import React from "react";
import { Content } from "./sections/Content/Content";
import { Hero } from "./sections/Hero/Hero";
import "./HomePage.scss";

export const HomePage = () => {
  return (
    <div className="homepage">
      <div className="homepage__content">
        <Hero />
        <Content />
      </div>
    </div>
  );
};

export default HomePage;