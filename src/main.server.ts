import * as xhr2 from 'xhr2';

//HACK - enables setting cookie header
xhr2.prototype._restrictedHeaders.cookie = false;

export { AppServerModule } from './app/app.server.module';