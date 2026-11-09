# Architecture rules

- Load the delivery schedule lazily behind a local error boundary so a delivery-module failure cannot prevent the rest of the application from mounting; preserve its named export when adapting it for React.lazy.