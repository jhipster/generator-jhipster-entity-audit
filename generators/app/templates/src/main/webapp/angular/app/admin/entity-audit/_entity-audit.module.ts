import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiffMatchPatchModule } from 'ng-diff-match-patch';

import { <%=angularXAppName%>SharedModule } from '../../shared';
import { EntityAuditRoutingModule } from './entity-audit-routing.module';
import { EntityAuditComponent } from './entity-audit.component';
import { EntityAuditModalComponent } from './entity-audit-modal.component';
import { EntityAuditService } from './entity-audit.service';

@NgModule({
    imports: [
        CommonModule,
        <%=angularXAppName%>SharedModule,
        DiffMatchPatchModule,
        EntityAuditRoutingModule
    ],
    declarations: [
        EntityAuditComponent,
        EntityAuditModalComponent
    ],
    // https://ng-bootstrap.github.io/#/components/modal/examples
    entryComponents: [
        EntityAuditModalComponent
    ],
    providers: [
        EntityAuditService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EntityAuditModule { }
