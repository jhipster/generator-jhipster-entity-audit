package <%=packageName%>.web.rest;

import <%=packageName%>.domain.EntityAuditEvent;
import <%=packageName%>.repository.EntityAuditEventRepository;
import <%=packageName%>.web.rest.util.PaginationUtil;
import <%=packageName%>.security.AuthoritiesConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.annotation.Secured;
import com.codahale.metrics.annotation.Timed;

import javax.inject.Inject;
import java.net.URISyntaxException;
import java.util.List;

/**
 * REST controller for getting the audit events for entity
 */
@RestController
@RequestMapping("/api")
public class JaversEntityAuditResource {

    private final Logger log = LoggerFactory.getLogger(JaversEntityAuditResource.class);

    @Inject
    private Javers javers;


    /**
     * fetches all the audited entity types
     *
     * @return
     */
    @RequestMapping(value = "/audits/entity/all",
        method = RequestMethod.GET,
        produces = MediaType.APPLICATION_JSON_VALUE)
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public List<String> getAuditedEntities() {

      //TODO this must come from configuration maybe or something else
      QueryBuilder jqlQuery = QueryBuilder.byClass(Book.class)
                                          .withNewObjectChanges(true).;

      List<Change> changes = javers.findChanges(jqlQuery.build());

      return javers.getJsonConverter().toJson(changes);
      //return entityAuditEventRepository.findAllEntityTypes();
    }

    /**
     * fetches the last 100 change list for an entity class, if limit is passed fetches that many changes
     *
     * @return
     */
    @RequestMapping(value = "/audits/entity/changes",
        method = RequestMethod.GET,
        produces = MediaType.APPLICATION_JSON_VALUE)
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<List<EntityAuditEvent>> getChanges(@RequestParam(value = "entityType") String entityType,
                                                             @RequestParam(value = "limit") int limit)
        throws URISyntaxException {
        log.debug("REST request to get a page of EntityAuditEvents");
        Pageable pageRequest = createPageRequest(limit);

        //Get the class by name!!
        QueryBuilder jqlQuery = QueryBuilder.byClass(Book.class)
                                            .limit(limit)
                                            .withNewObjectChanges(true).;

        List<Change> changes = javers.findChanges(jqlQuery.build());

        // Convert each javers event to EntityAuditEvent required by jhipster web gui
        HttpHeaders header = PaginationUtil.generatePaginationHttpHeaders(page, "/api/audits/entity/changes");

        return javers.getJsonConverter().toJson(changes);

        //Page<EntityAuditEvent> page = entityAuditEventRepository.findAllByEntityType(entityType, pageRequest);
        //HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(page, "/api/audits/entity/changes");
        //return new ResponseEntity<>(page.getContent(), headers, HttpStatus.OK);

    }

    /**
     * fetches a previous version for for an entity class and id
     *
     * @return
     */
    @RequestMapping(value = "/audits/entity/changes/version/previous",
        method = RequestMethod.GET,
        produces = MediaType.APPLICATION_JSON_VALUE)
    @Timed
    @Secured(AuthoritiesConstants.ADMIN)
    public ResponseEntity<EntityAuditEvent> getPrevVersion(@RequestParam(value = "qualifiedName") String qualifiedName,
                                                           @RequestParam(value = "entityId") Long entityId,
                                                           @RequestParam(value = "commitVersion") Integer commitVersion)
        throws URISyntaxException {

          // Get class by name!
          // Is it possible to filter on commit id or do I need to fetch all?
          QueryBuilder jqlQuery = QueryBuilder.byInstanceId(entityId, Book.class)
                                              .limit(1)
                                              .withNewObjectChanges(true);

        EntityAuditEvent prev = entityAuditEventRepository.findOneByEntityTypeAndEntityIdAndCommitVersion(qualifiedName, entityId, commitVersion);
        return new ResponseEntity<>(prev, HttpStatus.OK);

    }

    /**
     * creates a page request object for PaginationUti
     *
     * @return
     */
    private Pageable createPageRequest(int size) {
        return new PageRequest(0, size);
    }

}
