import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EntityAuditComponent } from './entity-audit.component';

const routes: Routes = [
    {
        path: 'entity-audit',
        component: EntityAuditComponent,
        data: {
            pageTitle: 'global.menu.admin.entity-audit'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EntityAuditRoutingModule { }
