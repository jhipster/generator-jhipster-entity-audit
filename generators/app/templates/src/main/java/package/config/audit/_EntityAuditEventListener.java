package <%=packageName%>.config.audit;

import <%=packageName%>.config.util.AutowireHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.stereotype.Component;

import javax.persistence.PostPersist;
import javax.persistence.PostRemove;
import javax.persistence.PostUpdate;

@Component
public class EntityAuditEventListener extends AuditingEntityListener {

    private final Logger log = LoggerFactory.getLogger(EntityAuditEventListener.class);

    @Autowired
    private AsyncEntityAuditEventWriter asyncEntityAuditEventWriter;

    @PostPersist
    public void onPostCreate(Object target) {
        try {
            //work around to autowire since spring doesnt autowire this
            AutowireHelper.autowire(this, this.asyncEntityAuditEventWriter);
            asyncEntityAuditEventWriter.writeAuditEvent(target, EntityAuditAction.CREATE);
        } catch (Exception e) {
            log.error("Exception while persisting create audit entity {}", e);
        }
    }

    @PostUpdate
    public void onPostUpdate(Object target) {
        try {
            //work around to autowire since spring doesnt autowire this
            AutowireHelper.autowire(this, this.asyncEntityAuditEventWriter);
            asyncEntityAuditEventWriter.writeAuditEvent(target, EntityAuditAction.UPDATE);
        } catch (Exception e) {
            log.error("Exception while persisting update audit entity {}", e);
        }
    }

    @PostRemove
    public void onPostRemove(Object target) {
        try {
            //work around to autowire since spring doesnt autowire this
            AutowireHelper.autowire(this, this.asyncEntityAuditEventWriter);
            asyncEntityAuditEventWriter.writeAuditEvent(target, EntityAuditAction.DELETE);
        } catch (Exception e) {
            log.error("Exception while persisting delete audit entity {}", e);
        }
    }

}
