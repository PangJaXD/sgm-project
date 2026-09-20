package org.sgm_project.demo;

import org.junit.jupiter.api.Test;
import org.sgm_project.demo.Util.UserValidationUtil;

import static org.junit.jupiter.api.Assertions.*;

class UserValidationUtilTest {

    @Test
    void testValidUsername() {
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("thanareth1"));
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("company001"));
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("user_name1"));
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("admin_thanapat"));
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("mr.kopp"));
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("12345678"));
        assertDoesNotThrow(() -> UserValidationUtil.validateUsername("abcdefghij1234567890"));
    }

    @Test
    void testInvalidUsername() {
        // null or blank
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validateUsername(null));
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validateUsername(""));
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validateUsername("   "));

        // space inside
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validateUsername("user name123"));

        // length < 4
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validateUsername("abc"));

        // length > 30
        assertThrows(IllegalArgumentException.class,
                () -> UserValidationUtil.validateUsername("thisusernameiswaytoolongtobevalid1234567890"));

        // Thai or disallowed symbols
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validateUsername("ผู้ใช้งาน1234"));
    }

    @Test
    void testValidPassword() {
        assertDoesNotThrow(() -> UserValidationUtil.validatePassword("12345678"));
        assertDoesNotThrow(() -> UserValidationUtil.validatePassword("pass123!"));
        assertDoesNotThrow(() -> UserValidationUtil.validatePassword("Secret#_123."));
        assertDoesNotThrow(() -> UserValidationUtil.validatePassword("admin1234567890_"));
    }

    @Test
    void testInvalidPassword() {
        // null or blank
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword(null));
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword(""));
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword("        "));

        // space inside
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword("pass 1234"));

        // length < 8
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword("pass!1"));

        // length > 16
        assertThrows(IllegalArgumentException.class,
                () -> UserValidationUtil.validatePassword("thispasswordiswaytoolong123!"));

        // Disallowed special chars (e.g. $, %, &)
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword("Password$123"));
        assertThrows(IllegalArgumentException.class, () -> UserValidationUtil.validatePassword("Password%123"));
    }
}
