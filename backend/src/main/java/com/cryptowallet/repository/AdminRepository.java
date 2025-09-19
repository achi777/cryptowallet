package com.cryptowallet.repository;

import com.cryptowallet.entity.Admin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    
    Optional<Admin> findByUsername(String username);
    
    Optional<Admin> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    List<Admin> findByActiveTrue();
    
    List<Admin> findByRole(Admin.AdminRole role);
    
    Page<Admin> findByActiveTrue(Pageable pageable);
    
    @Query("SELECT a FROM Admin a WHERE a.active = true AND " +
           "(LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Admin> searchAdmins(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT COUNT(a) FROM Admin a WHERE a.active = true")
    long countActiveAdmins();
    
    @Query("SELECT COUNT(a) FROM Admin a WHERE a.lastLogin >= :since")
    long countAdminsLoggedInSince(@Param("since") LocalDateTime since);
}