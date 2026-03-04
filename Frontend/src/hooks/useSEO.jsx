import { useEffect } from "react";

export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
}) => {
  const siteName = "Artwork Store";
  const defaultDescription =
    "Discover unique artworks and paintings from talented artists. Buy original art online.";
  const defaultImage = "/og-image.jpg";

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const fullDescription = description || defaultDescription;
  const fullImage = image || defaultImage;
  const fullUrl = url || window.location.href;

  useEffect(() => {
    // Set title
    document.title = fullTitle;

    const setMetaTag = (name, content, property = false) => {
      let element;

      if (property) {
        element = document.querySelector(`meta[property="${name}"]`);
      } else {
        element = document.querySelector(`meta[name="${name}"]`);
      }

      if (!element) {
        element = document.createElement("meta");

        if (property) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }

        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Basic SEO
    setMetaTag("description", fullDescription);
    if (keywords) setMetaTag("keywords", keywords);

    // Open Graph
    setMetaTag("og:title", fullTitle, true);
    setMetaTag("og:description", fullDescription, true);
    setMetaTag("og:image", fullImage, true);
    setMetaTag("og:url", fullUrl, true);
    setMetaTag("og:type", type, true);
    setMetaTag("og:site_name", siteName, true);

    // Twitter
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("twitter:description", fullDescription);
    setMetaTag("twitter:image", fullImage);

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']");

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", fullUrl);
  }, [title, description, keywords, image, url, type]);
};