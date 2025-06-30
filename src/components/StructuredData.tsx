import React from "react";

// Base schema interface
interface BaseSchema {
  "@context": string;
  "@type": string;
}

// Organization schema
interface OrganizationSchema extends BaseSchema {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    "@type": "ContactPoint";
    telephone?: string;
    contactType?: string;
  };
  sameAs?: string[];
}

type StructuredDataSchema = OrganizationSchema | BaseSchema; // Fallback for custom schemas

interface StructuredDataProps {
  data: StructuredDataSchema | StructuredDataSchema[];
}

const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
};

export default StructuredData;
