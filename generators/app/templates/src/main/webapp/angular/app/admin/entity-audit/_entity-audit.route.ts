import { Route } from '@angular/router/src';

import { EntityAuditComponent } from './entity-audit.component';

export const entityAuditRoute: Route = {
    path: 'entity-audit',
    component: EntityAuditComponent,
    data: {
        pageTitle: 'Entity Audit'
    }
};
