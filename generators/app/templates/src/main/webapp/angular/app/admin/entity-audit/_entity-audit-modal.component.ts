import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EntityAuditService } from './entity-audit.service';
import { EntityAuditEvent } from './entity-audit-event.model';

@Component({
    selector: 'jhi-entity-audit-modal',
    templateUrl: './entity-audit-modal.component.html',
    styles: [`
        /* NOTE: for now the /deep/ shadow-piercing descendant combinator is
         * required because Angular defaults to emulated view encapsulation and
         * preprocesses all component styles to approximate shadow scoping
         * rules. This means these styles wouldn't apply to the HTML generated
         * by ng-diff-match-patch.
         *
         * This shouldn't be required when browsers support native
         * encapsulation, at which point /deep/ will also be deprecated/removed
         * see https://angular.io/guide/component-styles
         */

        :host /deep/ ins {
            color: black;
            background: #bbffbb;
        }

        :host /deep/ del {
            color: black;
            background: #ffbbbb;
        }

        .code {
          background: #dcdada;
          padding: 10px;
        }
    `]
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
