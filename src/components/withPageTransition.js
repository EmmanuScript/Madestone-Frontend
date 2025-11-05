import React from "react";
import { CSSTransition } from "react-transition-group";
import "../styles/animations.css";

export default function withPageTransition(WrappedComponent) {
  return function WithPageTransition(props) {
    return (
      <CSSTransition
        in={true}
        appear={true}
        timeout={300}
        classNames="page"
        unmountOnExit
      >
        <WrappedComponent {...props} />
      </CSSTransition>
    );
  };
}
