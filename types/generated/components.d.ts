import type { Schema, Struct } from '@strapi/strapi';

export interface SharedEtaxBenefitItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_etax_benefit_items';
  info: {
    displayName: 'etax-benefit-item';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text: Schema.Attribute.String;
  };
}

export interface SharedEtaxCostItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_etax_cost_items';
  info: {
    displayName: 'etax-cost-item';
  };
  attributes: {
    label: Schema.Attribute.String;
    price: Schema.Attribute.String;
  };
}

export interface SharedEtaxPainItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_etax_pain_items';
  info: {
    displayName: 'etax-pain-item';
  };
  attributes: {
    text: Schema.Attribute.String;
  };
}

export interface SharedInfoRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_info_rows';
  info: {
    displayName: 'info_row';
  };
  attributes: {
    key: Schema.Attribute.String;
    value: Schema.Attribute.Text;
  };
}

export interface SharedItFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_it_feature_items';
  info: {
    displayName: 'it-feature-item';
  };
  attributes: {
    desc: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedItServiceItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_it_service_items';
  info: {
    displayName: 'it-service-item';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface SharedLogstarAccordionItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_logstar_accordion_items';
  info: {
    displayName: 'logstar-accordion-item';
  };
  attributes: {
    content: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    sectionId: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedMarketingSocialIcon extends Struct.ComponentSchema {
  collectionName: 'components_shared_marketing_social_icons';
  info: {
    displayName: 'marketing-social-icon';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    label: Schema.Attribute.String;
  };
}

export interface SharedNewsCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_news_cards';
  info: {
    displayName: 'news_card';
  };
  attributes: {
    category: Schema.Attribute.String;
    date: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedServiceItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_service_items';
  info: {
    displayName: 'service_item';
  };
  attributes: {
    desc: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.etax-benefit-item': SharedEtaxBenefitItem;
      'shared.etax-cost-item': SharedEtaxCostItem;
      'shared.etax-pain-item': SharedEtaxPainItem;
      'shared.info-row': SharedInfoRow;
      'shared.it-feature-item': SharedItFeatureItem;
      'shared.it-service-item': SharedItServiceItem;
      'shared.logstar-accordion-item': SharedLogstarAccordionItem;
      'shared.marketing-social-icon': SharedMarketingSocialIcon;
      'shared.news-card': SharedNewsCard;
      'shared.service-item': SharedServiceItem;
    }
  }
}
