import { config } from '../src/config/config.ts';
import { setSessionIdentity } from '../src/lib/sessionIdentity.ts';
setSessionIdentity({ id: config.testUser, tenantId: config.testTenant, name: 'Test employee', role: 'CLEANER' });
