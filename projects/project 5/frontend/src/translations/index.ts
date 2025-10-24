import { dashboardTranslations } from './components/dashboard';
import { authTranslations } from './components/auth';
import { deviceTranslations } from './components/device';
import { formTranslations } from './components/form';
import { layoutTranslations } from './components/layout';
import { newOrderTranslations } from './components/newOrder';
import { orderTranslations } from './components/order';
import { paymentTranslations } from './components/payment';
import { reportTranslations } from './components/report';
import { serviceTranslations } from './components/service';
import { socialTranslations } from './components/social';

export const translations = {
  en: {
    ...dashboardTranslations.en,
    ...authTranslations.en,
    ...deviceTranslations.en,
    ...formTranslations.en,
    ...layoutTranslations.en,
    ...newOrderTranslations.en,
    ...orderTranslations.en,
    ...paymentTranslations.en,
    ...reportTranslations.en,
    ...serviceTranslations.en,
    ...socialTranslations.en,
  },
  tr: {
    ...dashboardTranslations.tr,
    ...authTranslations.tr,
    ...deviceTranslations.tr,
    ...formTranslations.tr,
    ...layoutTranslations.tr,
    ...newOrderTranslations.tr,
    ...orderTranslations.tr,
    ...paymentTranslations.tr,
    ...reportTranslations.tr,
    ...serviceTranslations.tr,
    ...socialTranslations.tr,
  }
};