import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import JobsModule from './src/components/JobsModule';
import MarketplaceModule from './src/components/MarketplaceModule';
import PropertyModule from './src/components/PropertyModule';
import ServicesModule from './src/components/ServicesModule';
import DealsModule from './src/components/DealsModule';
import AlertsModule from './src/components/AlertsModule';
import BusinessModule from './src/components/BusinessModule';
import EventsModule from './src/components/EventsModule';
import GroupsModule from './src/components/GroupsModule';
import NotificationsModule from './src/components/NotificationsModule';

const testRender = (name, Component, props) => {
  try {
    renderToString(createElement(Component, props));
    console.log(`${name} Rendered successfully.`);
  } catch (e) {
    if (e.message.includes('sessionStorage') || e.message.includes('localStorage') || e.message.includes('window') || e.message.includes('document')) {
      // Expected SSR errors
      console.log(`${name} Rendered with expected SSR DOM error:`, e.message);
    } else {
      console.error(`${name} FATAL Error:`, e.stack || e.message);
    }
  }
};

const commonProps = { currentLanguage: 'en', currentUser: { id: '1', role: 'user', fullName: 'Test', email: 'test@test.com' } };

testRender('JobsModule', JobsModule, { ...commonProps, jobs: [], activeView: 'list' });
testRender('MarketplaceModule', MarketplaceModule, { ...commonProps, currentPath: '/marketplace', navigate: () => {} });
testRender('PropertyModule', PropertyModule, { ...commonProps, properties: [], activeView: 'list' });
testRender('ServicesModule', ServicesModule, { ...commonProps, items: [], activeView: 'list' });
testRender('DealsModule', DealsModule, { ...commonProps, deals: [], activeView: 'list' });
testRender('AlertsModule', AlertsModule, { ...commonProps, items: [], activeView: 'list' });
testRender('BusinessModule', BusinessModule, { ...commonProps, businesses: [], activeView: 'list' });
testRender('EventsModule', EventsModule, { ...commonProps, events: [], activeView: 'list' });
testRender('GroupsModule', GroupsModule, { ...commonProps, groups: [], activeView: 'list' });
testRender('NotificationsModule', NotificationsModule, { ...commonProps, notifications: [], activeView: 'list' });
