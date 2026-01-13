import { createRouter, RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "@packages/ui/globals.css";

const router = createRouter({
   defaultPendingMs: 0,
   defaultPreload: "intent",
   defaultPreloadDelay: 0,
   defaultPreloadStaleTime: 0,
   defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
         let direction = "none";

         if (fromLocation) {
            const fromIndex = fromLocation.state.__TSR_index;
            const toIndex = toLocation.state.__TSR_index;
            direction = fromIndex > toIndex ? "right" : "left";
         }

         return [`slide-${direction}`];
      },
   },
   routeTree,
   scrollRestoration: true,
});

declare module "@tanstack/react-router" {
   interface Register {
      router: typeof router;
   }
}

function App() {
   return <RouterProvider router={router} />;
}

// biome-ignore lint/style/noNonNullAssertion: root element is always present
const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
   const root = ReactDOM.createRoot(rootElement);
   root.render(
      <React.StrictMode>
         <App />
      </React.StrictMode>,
   );
}
