import { analytics } from './src/services/AnalyticsService'; analytics.identify('123'); analytics.track('post_like', { entity_type: 'post', module: 'feed', entity_id: '123' });  
