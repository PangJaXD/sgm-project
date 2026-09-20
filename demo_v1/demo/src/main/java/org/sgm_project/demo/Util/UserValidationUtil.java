package org.sgm_project.demo.Util;

import java.util.regex.Pattern;

public class UserValidationUtil {

    // 1. ภาษาอังกฤษหรือตัวเลข รวมอักขระพิเศษ [ !#_.- ], ความยาวตั้งแต่ 4 ตัวอักษร และไม่เกิน 30 ตัวอักษร,
    // ไม่มีเว้นวรรค, ไม่เป็นค่าว่าง
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9!#_.-]{4,30}$");

    // 2. ตัวอักษรภาษาอังกฤษหรือตัวเลข รวมอักขระพิเศษ [ !#_. ], ความยาวตั้งแต่ 8
    // ตัวอักษร และไม่เกิน 16 ตัวอักษร, ไม่มีเว้นวรรค, ไม่เป็นค่าว่าง
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^[a-zA-Z0-9!#_.]{8,16}$");

    public static void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("ชื่อผู้ใช้งานต้องไม่เป็นค่าว่าง");
        }
        if (username.contains(" ")) {
            throw new IllegalArgumentException("ชื่อผู้ใช้งานต้องไม่มีเว้นวรรคหรือช่องว่าง");
        }
        if (username.length() < 4 || username.length() > 30) {
            throw new IllegalArgumentException("ชื่อผู้ใช้งานต้องมีความยาวตั้งแต่ 4 ตัวอักษร และไม่เกิน 30 ตัวอักษร");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new IllegalArgumentException("ชื่อผู้ใช้งานต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ [ !#_.- ] เท่านั้น");
        }
    }

    public static void validatePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("รหัสผ่านต้องไม่เป็นค่าว่าง");
        }
        if (password.contains(" ")) {
            throw new IllegalArgumentException("รหัสผ่านต้องไม่มีเว้นวรรคหรือช่องว่าง");
        }
        if (password.length() < 8 || password.length() > 16) {
            throw new IllegalArgumentException("รหัสผ่านต้องมีความยาวตั้งแต่ 8 ตัวอักษร และไม่เกิน 16 ตัวอักษร");
        }
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException(
                    "รหัสผ่านต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ [ !#_. ] เท่านั้น");
        }
    }
}
