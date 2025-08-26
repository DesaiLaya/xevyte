package com.register.example.service;

import com.register.example.entity.Employee;
import com.register.example.entity.LeaveBalance;
import com.register.example.repository.EmployeeRepository;
import com.register.example.repository.LeaveBalanceRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LeaveAssignmentService {

    private final LeaveBalanceRepository leaveBalanceRepo;
    private final EmployeeRepository employeeRepo;

    public LeaveAssignmentService(LeaveBalanceRepository leaveBalanceRepo, EmployeeRepository employeeRepo) {
        this.leaveBalanceRepo = leaveBalanceRepo;
        this.employeeRepo = employeeRepo;
    }

    /**
     * Assigns CL and SL based on joining month.
     * - If joined this year -> prorated from joining month to Dec.
     * - If joined before this year -> full 12 CL + 12 SL.
     */
    @Transactional
    public int assignLeavesByMonth(String employeeId) {
        Employee employee = employeeRepo.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        LocalDate joiningDate = employee.getJoiningDate();
        int joiningYear = joiningDate.getYear();
        int joiningMonth = joiningDate.getMonthValue();
        int currentYear = LocalDate.now().getYear();

        int monthsToAssign;
        if (joiningYear < currentYear) {
            monthsToAssign = 12; // Full year for employees joined in previous years
        } else {
            // Prorated from joining month to end of the year
            monthsToAssign = 12 - joiningMonth + 1;
        }

        // Check if balances already exist for the current year
        List<LeaveBalance> existingBalances = leaveBalanceRepo.findByEmployeeIdAndYear(employeeId, currentYear);

        if (!existingBalances.isEmpty()) {
            throw new IllegalStateException("Leave balances already assigned for employee: " + employeeId + " for the current year.");
        }

        // Assign CL
        LeaveBalance clBalance = new LeaveBalance();
        clBalance.setEmployeeId(employeeId);
        clBalance.setType("CL");
        clBalance.setGranted(monthsToAssign);
        clBalance.setConsumed(0);
        clBalance.setBalance(monthsToAssign);
        clBalance.setYear(currentYear);
        leaveBalanceRepo.save(clBalance);

        // Assign SL
        LeaveBalance slBalance = new LeaveBalance();
        slBalance.setEmployeeId(employeeId);
        slBalance.setType("SL");
        slBalance.setGranted(monthsToAssign);
        slBalance.setConsumed(0);
        slBalance.setBalance(monthsToAssign);
        slBalance.setYear(currentYear);
        leaveBalanceRepo.save(slBalance);

        // Assign LOP
        LeaveBalance lopBalance = new LeaveBalance();
        lopBalance.setEmployeeId(employeeId);
        lopBalance.setType("LOP");
        lopBalance.setGranted(0);
        lopBalance.setConsumed(0);
        lopBalance.setBalance(0);
        lopBalance.setYear(currentYear);
        leaveBalanceRepo.save(lopBalance);

        return monthsToAssign;
    }

    /**
     * Scheduled: Assign CL + SL at the start of each year to all employees.
     */
   @Scheduled(cron = "0 0 0 1 1 *")
 // @Scheduled(cron = "0 * * * * *")

    @Transactional
    public void assignAnnualLeavesToAllEmployees() {
        System.out.println("⏰ Scheduler triggered at " + LocalDateTime.now());

        List<Employee> employees = employeeRepo.findAll();
        int currentYear = LocalDate.now().getYear();

        for (Employee employee : employees) {
            LocalDate joiningDate = employee.getJoiningDate();
            if (joiningDate == null) {
                System.out.println("⚠️ Skipping employee " + employee.getEmployeeId() + " (joining date NULL)");
                continue;
            }

            // Check if balances already exist for the current year to avoid duplicates
            List<LeaveBalance> existingBalances = leaveBalanceRepo.findByEmployeeIdAndYear(employee.getEmployeeId(), currentYear);

            if (!existingBalances.isEmpty()) {
                System.out.println("Skipping annual assignment for employee " + employee.getEmployeeId() + " (already assigned for " + currentYear + ")");
                continue;
            }

            int joiningYear = joiningDate.getYear();
            int joiningMonth = joiningDate.getMonthValue();
            int monthsToAssign;

            if (joiningYear < currentYear) {
                monthsToAssign = 12; // Full year for existing employees
            } else {
                monthsToAssign = 12 - joiningMonth + 1; // Prorated for new employees
            }

            // Assign CL
            LeaveBalance clBalance = new LeaveBalance();
            clBalance.setEmployeeId(employee.getEmployeeId());
            clBalance.setType("CL");
            clBalance.setGranted(monthsToAssign);
            clBalance.setConsumed(0);
            clBalance.setBalance(monthsToAssign);
            clBalance.setYear(currentYear);
            leaveBalanceRepo.save(clBalance);

            // Assign SL
            LeaveBalance slBalance = new LeaveBalance();
            slBalance.setEmployeeId(employee.getEmployeeId());
            slBalance.setType("SL");
            slBalance.setGranted(monthsToAssign);
            slBalance.setConsumed(0);
            slBalance.setBalance(monthsToAssign);
            slBalance.setYear(currentYear);
            leaveBalanceRepo.save(slBalance);

            // Assign LOP
            LeaveBalance lopBalance = new LeaveBalance();
            lopBalance.setEmployeeId(employee.getEmployeeId());
            lopBalance.setType("LOP");
            lopBalance.setGranted(0);
            lopBalance.setConsumed(0);
            lopBalance.setBalance(0);
            lopBalance.setYear(currentYear);
            leaveBalanceRepo.save(lopBalance);

            System.out.println("✅ Annual leaves assigned to: " + employee.getEmployeeId() + " (" + monthsToAssign + " months)");
        }
    }

    /**
     * Get leave balance summary for one employee.
     */
    public Map<String, Integer> getLeaveBalance(String employeeId) {
        List<LeaveBalance> balances = leaveBalanceRepo.findByEmployeeId(employeeId);

        int casualTotal = 0;
        int casualUsed = 0;
        int sickTotal = 0;
        int sickUsed = 0;
        int lopUsed = 0;

        for (LeaveBalance balance : balances) {
            switch (balance.getType().toUpperCase()) {
                case "CL":
                    casualTotal = balance.getGranted();
                    casualUsed = balance.getConsumed();
                    break;
                case "SL":
                    sickTotal = balance.getGranted();
                    sickUsed = balance.getConsumed();
                    break;
                case "LOP":
                    lopUsed = balance.getConsumed();
                    break;
            }
        }

        Map<String, Integer> summary = new HashMap<>();
        summary.put("casualTotal", casualTotal);
        summary.put("casualUsed", casualUsed);
        summary.put("sickTotal", sickTotal);
        summary.put("sickUsed", sickUsed);
        summary.put("lopUsed", lopUsed);

        return summary;
    }

    /**
     * Deduct leaves after approval; excess goes into LOP.
     */
    @Transactional
    public void deductLeaves(String employeeId, String leaveType, int daysToDeduct) {
        Optional<LeaveBalance> leaveBalanceOpt = leaveBalanceRepo.findByEmployeeIdAndType(employeeId, leaveType);

        if (leaveBalanceOpt.isEmpty()) {
            throw new RuntimeException("Leave balance not found for employee: " + employeeId + " and type: " + leaveType);
        }

        LeaveBalance leaveBalance = leaveBalanceOpt.get();
        int availableBalance = leaveBalance.getGranted() - leaveBalance.getConsumed();
        int remainingToDeduct = daysToDeduct;

        // Deduct from requested type first
        if (availableBalance > 0) {
            int deducted = Math.min(availableBalance, remainingToDeduct);
            leaveBalance.setConsumed(leaveBalance.getConsumed() + deducted);
            leaveBalance.setBalance(leaveBalance.getGranted() - leaveBalance.getConsumed());
            leaveBalanceRepo.save(leaveBalance);
            remainingToDeduct -= deducted;
        }

        // Remaining goes into LOP
        if (remainingToDeduct > 0) {
            // Find or create the LOP balance
            LeaveBalance lopBalance = leaveBalanceRepo.findByEmployeeIdAndType(employeeId, "LOP")
                    .orElseGet(() -> {
                        LeaveBalance newLop = new LeaveBalance();
                        newLop.setEmployeeId(employeeId);
                        newLop.setType("LOP");
                        newLop.setGranted(0);
                        newLop.setConsumed(0);
                        newLop.setBalance(0);
                        newLop.setYear(LocalDate.now().getYear());
                        return newLop;
                    });

            lopBalance.setConsumed(lopBalance.getConsumed() + remainingToDeduct);
            lopBalance.setBalance(lopBalance.getBalance() - remainingToDeduct);
            leaveBalanceRepo.save(lopBalance);
        }
    }
}