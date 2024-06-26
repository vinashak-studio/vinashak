import { useState } from "react";
import { and, isVisible, rankWith, uiTypeIs } from "@jsonforms/core";
import { withJsonFormsLayoutProps } from "@jsonforms/react";
import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { TailwindLayoutRenderer, withAjvProps } from "../util";

const TailwindCategorizationLayoutRenderer = (props) => {
  const { data, path, renderers, cells, schema, uischema, visible, enabled, selected, onChange, ajv } = props;
  const [activeCategory, setActiveCategory] = useState(selected ?? 0);

  if (!visible) return null;

  const categories = uischema.elements.filter((category) => isVisible(category, data, undefined, ajv));
  const childProps = {
    elements: categories[activeCategory].elements,
    schema,
    path,
    direction: "column",
    enabled,
    visible,
    renderers,
    cells
  };
  const onTabChange = (_event, value) => {
    if (onChange) {
      onChange(value, activeCategory);
    }
    setActiveCategory(value);
  };
  return (
    <>
      <AppBar position="static">
        <Tabs value={activeCategory} onChange={onTabChange} textColor="inherit" indicatorColor="secondary" variant="scrollable">
          {Array.isArray(categories) && categories.map((e, idx) => <Tab key={idx} label={e.label} />)}
        </Tabs>
      </AppBar>
      <div style={{ marginTop: "0.5em" }}>
        <TailwindLayoutRenderer layout="categorization" {...childProps} />
      </div>
    </>
  );
};

export const tailwindCategorizationControlTester = rankWith(
  1001,
  and(uiTypeIs("Categorization"), (uischema) => uischema.elements?.reduce((acc, e) => acc && e.type === "Category", true))
);

export const TailwindCategorizationControl = withJsonFormsLayoutProps(withAjvProps(TailwindCategorizationLayoutRenderer));
