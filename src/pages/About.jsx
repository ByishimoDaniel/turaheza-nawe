
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  Building2,
  Target,
  Handshake,
  ShieldCheck,
  ArrowRight,
  Mail,
  Phone,
  Globe,
  FileCheck2,
  HardHat,
  ClipboardCheck,
  Ruler,
  MapPinned,
  Leaf,
  Calculator,
  FileText,
  CheckCircle2,
  PlayCircle,
  Home,
  KeyRound,
  Store,
  BriefcaseBusiness,
  Map,
  Building,
  BedDouble,
} from "lucide-react";

const WPD_WEBSITE = "https://wpdltd.vercel.app";

const team = [
  {
    name: "Daniel Byishimo",
    positionKey: "team.daniel",
    phone: "0796189550",
    email: "danielbyishimo340@gmail.com",
    initials: "DB",
  },
  {
    name: "Shema Frank",
    positionKey: "team.shema",
    phone: "0789548261",
    email: "shemafrank20@gmail.com",
    initials: "SF",
  },
  {
    name: "Mushimiyimana Mussa",
    positionKey: "team.mussa",
    phone: "0788468233",
    email: "mmussa2510@gmail.com",
    initials: "MM",
  },
  {
    name: "Maniraguha Ettiene",
    positionKey: "team.engineer",
    phone: "0786200854",
    email: "metienne1017@gmail.com",
    initials: "ME",
    website: WPD_WEBSITE,
  },
];

const values = [
  {
    icon: ShieldCheck,
    titleKey: "values.trustTitle",
    textKey: "values.trustText",
  },
  {
    icon: Handshake,
    titleKey: "values.connectTitle",
    textKey: "values.connectText",
  },
  {
    icon: Target,
    titleKey: "values.customerTitle",
    textKey: "values.customerText",
  },
];

const propertyTypes = [
  { icon: Map, key: "land" },
  { icon: Home, key: "houses" },
  { icon: Building2, key: "villas" },
  { icon: Building, key: "apartments" },
  { icon: BedDouble, key: "rooms" },
  { icon: BriefcaseBusiness, key: "offices" },
  { icon: Store, key: "shops" },
  { icon: Building, key: "commercial" },
];

const services = [
  { icon: FileCheck2, key: "permit" },
  { icon: HardHat, key: "construction" },
  { icon: ClipboardCheck, key: "supervision" },
  { icon: Ruler, key: "drawings" },
  { icon: MapPinned, key: "landAdvice" },
  { icon: Leaf, key: "environment" },
  { icon: Calculator, key: "estimation" },
  { icon: FileText, key: "specifications" },
];

const gallery = [
  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
    fallback:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    titleKey: "gallery.housesTitle",
    textKey: "gallery.housesText",
  },
  {
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85",
    fallback:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
    titleKey: "gallery.officesTitle",
    textKey: "gallery.officesText",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85",
    fallback:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80",
    titleKey: "gallery.landTitle",
    textKey: "gallery.landText",
  },
];

function GalleryImage({ item, title }) {
  return (
    <img
      src={item.image}
      alt={title}
      loading="lazy"
      onError={(event) => {
        const image = event.currentTarget;

        if (image.dataset.fallbackUsed !== "true") {
          image.dataset.fallbackUsed = "true";
          image.src = item.fallback;
        }
      }}
    />
  );
}

export default function About() {
  const { t } = useTranslation();

  return (
    <main className="tn-about-page">
      {/* HERO */}
      <section className="tn-about-hero">
        <div className="tn-about-hero-content">
          <span className="tn-about-eyebrow">
            {t("about.welcome")}
          </span>

          <h1>
            {t("about.heroTitle")}
            <br />
            {t("about.heroHighlight")}
          </h1>

          <p>{t("about.heroDescription")}</p>

          <div className="tn-about-hero-actions">
            <Link to="/properties" className="tn-about-cta">
              {t("about.exploreProperties")} <ArrowRight size={18} />
            </Link>

            <Link to="/search" className="tn-about-secondary">
              {t("about.searchListings")}
            </Link>
          </div>

          <div className="tn-about-trust-line">
            <CheckCircle2 size={18} />
            <span>{t("about.trustLine")}</span>
          </div>
        </div>

        <div className="tn-about-hero-art">
          <GalleryImage
            item={gallery[0]}
            title={t(gallery[0].titleKey)}
          />

          <div className="tn-about-art-caption">
            <Building2 size={28} />
            <div>
              <strong>{t("about.artTitle")}</strong>
              <span>{t("about.artDescription")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROPERTY CATEGORIES */}
      <section className="tn-property-types">
        <div className="tn-section-heading">
          <span className="tn-about-eyebrow">
            {t("about.marketplaceEyebrow")}
          </span>
          <h2>{t("about.categoriesTitle")}</h2>
          <p>{t("about.categoriesDescription")}</p>
        </div>

        <div className="tn-property-types-grid">
          {propertyTypes.map(({ icon: Icon, key }) => (
            <article className="tn-property-type-card" key={key}>
              <div className="tn-property-type-icon">
                <Icon size={27} />
              </div>

              <h3>{t(`about.propertyTypes.${key}Title`)}</h3>
              <p>{t(`about.propertyTypes.${key}Text`)}</p>

              <Link to="/properties" className="tn-about-text-link">
                {t("about.exploreListings")} <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>

        <div className="tn-about-rent-buy">
          <div>
            <KeyRound size={26} />
            <h3>{t("about.rentTitle")}</h3>
            <p>{t("about.rentDescription")}</p>
            <Link to="/search" className="tn-about-cta">
              {t("about.findRental")} <ArrowRight size={17} />
            </Link>
          </div>

          <div>
            <Building2 size={26} />
            <h3>{t("about.buyTitle")}</h3>
            <p>{t("about.buyDescription")}</p>
            <Link to="/properties" className="tn-about-cta">
              {t("about.findProperty")} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section className="tn-about-intro">
        <div>
          <span className="tn-about-eyebrow">
            {t("about.whoWeAre")}
          </span>
          <h2>{t("about.introTitle")}</h2>
        </div>

        <div className="tn-about-intro-copy">
          <p>{t("about.introParagraph1")}</p>
          <p>{t("about.introParagraph2")}</p>
          <p>{t("about.introParagraph3")}</p>

          <a
            href={WPD_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="tn-about-text-link"
          >
            {t("about.visitWpd")} <ArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* PROPERTY PHOTO GALLERY */}
      <section className="tn-about-gallery-section">
        <div className="tn-section-heading">
          <span className="tn-about-eyebrow">
            {t("about.galleryEyebrow")}
          </span>
          <h2>{t("about.galleryTitle")}</h2>
          <p>{t("about.galleryDescription")}</p>
        </div>

        <div className="tn-about-gallery">
          {gallery.map((item) => (
            <article
              className="tn-about-gallery-card"
              key={item.titleKey}
            >
              <GalleryImage
                item={item}
                title={t(item.titleKey)}
              />

              <div className="tn-about-gallery-overlay">
                <h3>{t(item.titleKey)}</h3>
                <p>{t(item.textKey)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CONSTRUCTION SERVICES */}
      <section className="tn-about-services">
        <div className="tn-section-heading">
          <span className="tn-about-eyebrow">
            {t("about.servicesEyebrow")}
          </span>
          <h2>{t("about.servicesTitle")}</h2>
          <p>{t("about.servicesDescription")}</p>
        </div>

        <div className="tn-services-grid">
          {services.map(({ icon: Icon, key }) => (
            <article className="tn-service-card" key={key}>
              <div className="tn-service-icon">
                <Icon size={25} />
              </div>
              <h3>{t(`about.services.${key}Title`)}</h3>
              <p>{t(`about.services.${key}Text`)}</p>
            </article>
          ))}
        </div>

        <div className="tn-services-cta">
          <div>
            <h3>{t("about.servicesCtaTitle")}</h3>
            <p>{t("about.servicesCtaDescription")}</p>
          </div>

          <a
            href={WPD_WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="tn-about-cta"
          >
            {t("about.visitWpd")} <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* VIDEO */}
      <section className="tn-about-video-section">
        <div className="tn-about-video-copy">
          <span className="tn-about-eyebrow">
            {t("about.videoEyebrow")}
          </span>
          <h2>{t("about.videoTitle")}</h2>
          <p>{t("about.videoDescription")}</p>

          <a
            href="https://www.youtube.com/watch?v=xkN1nE9II78"
            target="_blank"
            rel="noopener noreferrer"
            className="tn-about-text-link"
          >
            <PlayCircle size={20} /> {t("about.watchYoutube")}
          </a>
        </div>

        <div className="tn-about-video-frame">
          <iframe
            src="https://www.youtube.com/embed/xkN1nE9II78"
            title={t("about.videoTitle")}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>

      {/* VALUES */}
      <section className="tn-about-values">
        <div className="tn-section-heading">
          <span className="tn-about-eyebrow">
            {t("about.valuesEyebrow")}
          </span>
          <h2>{t("about.valuesTitle")}</h2>
          <p>{t("about.valuesDescription")}</p>
        </div>

        <div className="tn-values-grid">
          {values.map(({ icon: Icon, titleKey, textKey }) => (
            <article className="tn-value-card" key={titleKey}>
              <div className="tn-value-icon">
                <Icon size={25} />
              </div>
              <h3>{t(`about.${titleKey}`)}</h3>
              <p>{t(`about.${textKey}`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="tn-team-section">
        <div className="tn-section-heading">
          <span className="tn-about-eyebrow">
            {t("about.teamEyebrow")}
          </span>
          <h2>{t("about.teamTitle")}</h2>
          <p>{t("about.teamDescription")}</p>
        </div>

        <div className="tn-team-grid">
          {team.map((member) => (
            <article className="tn-team-card" key={member.email}>
              <div className="tn-team-avatar">{member.initials}</div>

              <h3>{member.name}</h3>
              <span className="tn-team-position">
                {t(`about.${member.positionKey}`)}
              </span>

              <a
                href={`tel:${member.phone}`}
                className="tn-team-contact"
              >
                <Phone size={16} />
                <span>{member.phone}</span>
              </a>

              <a
                href={`mailto:${member.email}`}
                className="tn-team-contact"
              >
                <Mail size={16} />
                <span>{member.email}</span>
              </a>

              {member.website && (
                <a
                  href={member.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tn-team-website"
                >
                  <Globe size={16} />
                  {t("about.constructionWebsite")}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tn-about-bottom">
        <div>
          <h2>{t("about.bottomTitle")}</h2>
          <p>{t("about.bottomDescription")}</p>
        </div>

        <div className="tn-about-bottom-actions">
          <Link to="/properties" className="tn-about-cta">
            {t("about.exploreProperties")} <ArrowRight size={18} />
          </Link>

          <Link to="/contact" className="tn-about-secondary">
            {t("about.contactUs")}
          </Link>
        </div>
      </section>
    </main>
  );
}
