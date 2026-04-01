import { Page } from "@dynatrace/strato-components-preview/layouts";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Data } from "./pages/Data";
import { Header } from "./components/Header";
import { LookupList } from "./pages/LookupList";
import { UploadLookup } from "./pages/UploadLookup";

export const App = () => {
  return (
    <Page>
      <Page.Header>
        <Header />
      </Page.Header>
      <Page.Main>
        <Routes>
          <Route path="/" element={<LookupList />} />
          <Route path="/data" element={<Data />} />
          <Route path="/upload" element={<UploadLookup />} />
        </Routes>
      </Page.Main>
    </Page>
  );
};
