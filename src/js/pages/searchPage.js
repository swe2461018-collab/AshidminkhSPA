import { getNutritions } from "../services/nutritionService.js"; // Хоолны шим тэжээлийн өгөгдлийг авна.
import { buildFoodGroups, bindSearchEvents, renderDefaultTables, initNutritionData } from "../fn/foodSearchEvents.js"; // food_group бүрээр багцалсан food_code, food_name-үүдийг авна. Жишээ нь: "Cereals and Cereal products" → [{ food_code: "01_0106", food_name: "Barley flour, whole grain" }, ...]

import { renderSidebarPageLayout } from "../layouts/sidebarPageLayout.js"; // Sidebar-тай хуудасны layout-г үүсгэх
import { bindSidebar, bindMenuListToggle } from "../fn/sidebarEvents.js";

import { renderPageLayout } from "../layouts/pageLayout.js";
import { renderNotification } from "../layouts/notificationLayout.js";

import { renderSearchFoodName } from "../components/searchFoodNameSidebar.js";
import { renderSearchSettings } from "../components/searchSettingsSidebar.js";
import { renderFoodGroupList } from "../components/searchFoodGroupListSidebar.js";

export async function renderSearchPage() {
  const app = document.getElementById("app");

  app.innerHTML = renderPageLayout({
    content: renderNotification("Loading data..."),
  });

  try {
    const nutritionData = await getNutritions(); // Хүнсний найрлагын JSON өгөгдүүдлийг авна.
    initNutritionData(nutritionData);
    const groupedFoods = buildFoodGroups(nutritionData); // food_group бүрээр багцалсан food_code, food_name-үүдийг авна. Жишээ нь: "Cereals and Cereal products" → [{ food_code: "01_0106", food_name: "Barley flour, whole grain" }, ...]

    app.innerHTML = renderSidebarPageLayout({
      sidebarContent: `${renderSearchFoodName()} ${renderSearchSettings()} ${renderFoodGroupList(groupedFoods)}`,
      pageId: "search",
      pageTitle: "Food Composition Database",
      mainContent: `
      <div id="resultTbl">
        ${renderDefaultTables(nutritionData)}
      </div>
    `,
    });

    bindSidebar();
    bindMenuListToggle();
    bindSearchEvents();
  } catch (error) {
    app.innerHTML = renderPageLayout({
      content: renderNotification("Failed to load nutrition data.", "danger"),
    });
    console.error("Failed to load nutrition data:", error);
  }
}
