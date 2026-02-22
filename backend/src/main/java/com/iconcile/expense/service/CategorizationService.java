package com.iconcile.expense.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Rule-based categorization service.
 * Maintains a vendor-to-category mapping and applies it automatically.
 * Matching is case-insensitive and uses keyword/prefix matching for flexibility.
 */
@Service
public class CategorizationService {

    // Exact and keyword-based vendor → category mapping
    private static final Map<String, String> VENDOR_CATEGORY_MAP = new HashMap<>();

    static {
        // Food & Dining
        VENDOR_CATEGORY_MAP.put("swiggy", "Food");
        VENDOR_CATEGORY_MAP.put("zomato", "Food");
        VENDOR_CATEGORY_MAP.put("dominos", "Food");
        VENDOR_CATEGORY_MAP.put("mcdonalds", "Food");
        VENDOR_CATEGORY_MAP.put("kfc", "Food");
        VENDOR_CATEGORY_MAP.put("subway", "Food");
        VENDOR_CATEGORY_MAP.put("burger king", "Food");
        VENDOR_CATEGORY_MAP.put("pizza hut", "Food");
        VENDOR_CATEGORY_MAP.put("starbucks", "Food");
        VENDOR_CATEGORY_MAP.put("cafe coffee day", "Food");
        VENDOR_CATEGORY_MAP.put("blinkit", "Groceries");

        // Groceries
        VENDOR_CATEGORY_MAP.put("big bazaar", "Groceries");
        VENDOR_CATEGORY_MAP.put("dmart", "Groceries");
        VENDOR_CATEGORY_MAP.put("reliance fresh", "Groceries");
        VENDOR_CATEGORY_MAP.put("more supermarket", "Groceries");
        VENDOR_CATEGORY_MAP.put("zepto", "Groceries");
        VENDOR_CATEGORY_MAP.put("instamart", "Groceries");
        VENDOR_CATEGORY_MAP.put("amazon fresh", "Groceries");
        VENDOR_CATEGORY_MAP.put("grofers", "Groceries");
        VENDOR_CATEGORY_MAP.put("bigbasket", "Groceries");

        // Transport
        VENDOR_CATEGORY_MAP.put("uber", "Transport");
        VENDOR_CATEGORY_MAP.put("ola", "Transport");
        VENDOR_CATEGORY_MAP.put("rapido", "Transport");
        VENDOR_CATEGORY_MAP.put("irctc", "Transport");
        VENDOR_CATEGORY_MAP.put("indian railways", "Transport");
        VENDOR_CATEGORY_MAP.put("indigo", "Transport");
        VENDOR_CATEGORY_MAP.put("air india", "Transport");
        VENDOR_CATEGORY_MAP.put("spicejet", "Transport");
        VENDOR_CATEGORY_MAP.put("makemytrip", "Transport");
        VENDOR_CATEGORY_MAP.put("goibibo", "Transport");

        // Utilities
        VENDOR_CATEGORY_MAP.put("bescom", "Utilities");
        VENDOR_CATEGORY_MAP.put("bwssb", "Utilities");
        VENDOR_CATEGORY_MAP.put("tata power", "Utilities");
        VENDOR_CATEGORY_MAP.put("adani electricity", "Utilities");
        VENDOR_CATEGORY_MAP.put("jio", "Utilities");
        VENDOR_CATEGORY_MAP.put("airtel", "Utilities");
        VENDOR_CATEGORY_MAP.put("vi", "Utilities");
        VENDOR_CATEGORY_MAP.put("bsnl", "Utilities");
        VENDOR_CATEGORY_MAP.put("hathway", "Utilities");
        VENDOR_CATEGORY_MAP.put("act fibernet", "Utilities");

        // Entertainment
        VENDOR_CATEGORY_MAP.put("netflix", "Entertainment");
        VENDOR_CATEGORY_MAP.put("amazon prime", "Entertainment");
        VENDOR_CATEGORY_MAP.put("hotstar", "Entertainment");
        VENDOR_CATEGORY_MAP.put("disney", "Entertainment");
        VENDOR_CATEGORY_MAP.put("spotify", "Entertainment");
        VENDOR_CATEGORY_MAP.put("youtube premium", "Entertainment");
        VENDOR_CATEGORY_MAP.put("bookmyshow", "Entertainment");
        VENDOR_CATEGORY_MAP.put("pvr", "Entertainment");
        VENDOR_CATEGORY_MAP.put("inox", "Entertainment");
        VENDOR_CATEGORY_MAP.put("sony liv", "Entertainment");

        // Shopping
        VENDOR_CATEGORY_MAP.put("amazon", "Shopping");
        VENDOR_CATEGORY_MAP.put("flipkart", "Shopping");
        VENDOR_CATEGORY_MAP.put("myntra", "Shopping");
        VENDOR_CATEGORY_MAP.put("ajio", "Shopping");
        VENDOR_CATEGORY_MAP.put("nykaa", "Shopping");
        VENDOR_CATEGORY_MAP.put("meesho", "Shopping");
        VENDOR_CATEGORY_MAP.put("snapdeal", "Shopping");

        // Health & Wellness
        VENDOR_CATEGORY_MAP.put("apollo pharmacy", "Health");
        VENDOR_CATEGORY_MAP.put("medplus", "Health");
        VENDOR_CATEGORY_MAP.put("1mg", "Health");
        VENDOR_CATEGORY_MAP.put("pharmeasy", "Health");
        VENDOR_CATEGORY_MAP.put("netmeds", "Health");
        VENDOR_CATEGORY_MAP.put("cult.fit", "Health");
        VENDOR_CATEGORY_MAP.put("curefit", "Health");
        VENDOR_CATEGORY_MAP.put("lybrate", "Health");

        // Education
        VENDOR_CATEGORY_MAP.put("udemy", "Education");
        VENDOR_CATEGORY_MAP.put("coursera", "Education");
        VENDOR_CATEGORY_MAP.put("unacademy", "Education");
        VENDOR_CATEGORY_MAP.put("byju", "Education");
        VENDOR_CATEGORY_MAP.put("vedantu", "Education");
        VENDOR_CATEGORY_MAP.put("upgrad", "Education");

        // Finance
        VENDOR_CATEGORY_MAP.put("zerodha", "Finance");
        VENDOR_CATEGORY_MAP.put("groww", "Finance");
        VENDOR_CATEGORY_MAP.put("paytm money", "Finance");
        VENDOR_CATEGORY_MAP.put("hdfc bank", "Finance");
        VENDOR_CATEGORY_MAP.put("sbi", "Finance");
        VENDOR_CATEGORY_MAP.put("icici", "Finance");
        VENDOR_CATEGORY_MAP.put("lic", "Finance");
    }

    /**
     * Categorizes expense based on vendor name using keyword matching.
     * Strategy:
     * 1. Try exact (case-insensitive) match
     * 2. Try substring/keyword match (vendor map key is a keyword in vendor name)
     * 3. Default to "Other"
     */
    public String categorize(String vendorName) {
        if (vendorName == null || vendorName.isBlank()) return "Other";

        String normalizedVendor = vendorName.trim().toLowerCase();

        // 1. Exact match
        if (VENDOR_CATEGORY_MAP.containsKey(normalizedVendor)) {
            return VENDOR_CATEGORY_MAP.get(normalizedVendor);
        }

        // 2. Keyword match - check if any known vendor keyword is contained in the input
        for (Map.Entry<String, String> entry : VENDOR_CATEGORY_MAP.entrySet()) {
            if (normalizedVendor.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return "Other";
    }

    public Map<String, String> getAllMappings() {
        return VENDOR_CATEGORY_MAP;
    }
}
