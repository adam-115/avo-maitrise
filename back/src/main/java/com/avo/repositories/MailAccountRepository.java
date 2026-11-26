package com.avo.repositories;

import com.avo.entities.MailAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MailAccountRepository extends JpaRepository<MailAccount, Long> {

    List<MailAccount> findByOwnerUsernameAndActiveTrueOrderByCreatedAtDesc(String ownerUsername);

    List<MailAccount> findByActiveTrueOrderByCreatedAtDesc();

    Optional<MailAccount> findByOwnerUsernameAndProviderAndEmailAddressIgnoreCase(
            String ownerUsername, String provider, String emailAddress);

    List<MailAccount> findByOwnerUsernameAndActiveTrueAndCalendarSyncEnabledTrue(String ownerUsername);
}
