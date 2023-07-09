// AppInsights
import { ApplicationInsights } from '@microsoft/applicationinsights-web'
const appInsights = new ApplicationInsights({ config: {
  connectionString: 'InstrumentationKey=5dbf6d49-a294-4cd9-96dd-892f4da7dd55;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/',
  enableAutoRouteTracking: true
  /* ...Other Configuration Options... */
} });
appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview


window.addEventListener("unhandledrejection", (event) => {
  appInsights.trackException({exception: event.reason});
});

export function trackPageView() {
  appInsights.trackPageView({uri: window.location.href});
}

export function trackEvent(name, properties) {
  appInsights.trackEvent({name, properties});
}