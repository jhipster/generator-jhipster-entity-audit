import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DiffMatchPatchModule } from 'ng-diff-match-patch';

import { SharedModule } from 'app/shared/shared.module';
import { entityAuditRoute } from './entity-audit-routing.module';
import { EntityAuditComponent } from './entity-audit.component';
import { EntityAuditModalComponent } from './entity-audit-modal.component';

@NgModule({
    imports: [
        SharedModule,
        DiffMatchPatchModule,
        RouterModule.forChild([entityAuditRoute])
    ],
    declarations: [
        EntityAuditComponent,
        EntityAuditModalComponent
    ],
    // https://ng-bootstrap.github.io/#/components/modal/examples
    entryComponents: [
        EntityAuditModalComponent
    ]
})
export class EntityAuditModule {}
