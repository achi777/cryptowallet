package com.cryptowallet.repository;

import com.cryptowallet.entity.User;
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
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Admin panel queries
    long countByActiveTrue();
    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    Page<User> findByActiveTrue(Pageable pageable);
    Page<User> findByActiveFalse(Pageable pageable);

    // Role-aware queries (replace AdminRepository)
    List<User> findByRole(User.Role role);
    Page<User> findByRole(User.Role role, Pageable pageable);
    long countByRole(User.Role role);
    boolean existsByRole(User.Role role);
    Page<User> findByRoleAndActiveTrue(User.Role role, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.active = true")
    long countActiveByRole(@Param("role") User.Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.lastLogin >= :since")
    long countByRoleAndLastLoginSince(@Param("role") User.Role role, @Param("since") LocalDateTime since);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.active = true AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchByRole(@Param("role") User.Role role, @Param("search") String search, Pageable pageable);
}
