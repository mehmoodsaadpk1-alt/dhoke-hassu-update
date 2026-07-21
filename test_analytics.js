"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AnalyticsService_1 = require("./src/services/AnalyticsService");
AnalyticsService_1.analytics.identify('123');
AnalyticsService_1.analytics.track('post_like', { entity_type: 'post', module: 'feed', entity_id: '123' });
