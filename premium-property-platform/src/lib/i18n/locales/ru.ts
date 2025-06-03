// src/lib/i18n/locales/ru.ts
export default {
  greeting: 'Привет',
  navbar: {
    home: 'Главная',
    properties: 'Объекты',
    login: 'Войти',
    signup: 'Регистрация',
    profile: 'Профиль',
    logout: 'Выйти',
    dashboard: 'Панель Управления',
    language: 'Язык',
  },
  homepage: {
    hero_title: 'Находите, Размещайте, Связывайтесь',
    hero_subtitle: 'Ваша Премиальная Платформа для Брокеров',
    hero_cta_join: 'Присоединиться',
    hero_cta_search: 'Искать Объекты',
  },
  dashboard_sidebar: {
    menu_title: 'Меню Панели',
    overview: 'Обзор',
    my_properties: 'Мои Объекты',
    my_clients: 'Мои Клиенты',
    messages: 'Сообщения',
    calendar: 'Календарь',
    profile_settings: 'Профиль и Настройки',
    back_to_homepage: 'Вернуться на Главную',
    my_calls: 'Мои Звонки', // Added
  },
  dashboard: {
    title: 'Панель Управления',
    welcome: 'Добро пожаловать на вашу панель управления!',
  }
} as const;
