"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const adminRoutes_1 = __importDefault(require("./src/Routes/Admin/adminRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/admin', adminRoutes_1.default);
const PORT = 4000;
app.get("/test", (req, res) => {
    console.log("🔥 TEST ROUTE HIT");
    res.json({
        success: true,
        message: "Test route working",
    });
});
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map