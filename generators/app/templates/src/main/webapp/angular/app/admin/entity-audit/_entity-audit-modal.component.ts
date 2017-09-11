import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EntityAuditService } from './entity-audit.service';
import { EntityAuditEvent } from './entity-audit-event.model';

@Component({
    selector: 'jhi-entity-audit-modal',
    templateUrl: './entity-audit-modal.component.html',
    styleUrls: ['./entity-audit-modal.component.css']
})
export class EntityAuditModalComponent {
    action: string;
    left: string;
    right: string;

    constructor(
        private service: EntityAuditService,
        public activeModal: NgbActiveModal
    ) {}

    openChange(audit: EntityAuditEvent) {
        this.service.getPrevVersion(
            audit.entityType, audit.entityId, audit.commitVersion
        ).subscribe((data) => {
            const previousVersion = JSON.stringify(JSON.parse(data.entityValue), null, 2);
            const currentVersion = JSON.stringify(audit.entityValue, null, 2);

            this.action = audit.action;
            this.left = previousVersion;
            this.right = currentVersion;
        });
    }
}
