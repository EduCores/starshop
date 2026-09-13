import { test, expect, Page } from "@playwright/test";

// Agrega el primer producto y navega al checkout vía el drawer (SPA):
// addItem ocurre 850ms después del click, así que hay que esperar al drawer.
async function agregarYIrAlCheckout(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Agregar" }).first().click();
  const checkoutLink = page.locator('a[href="/checkout"]').first();
  // Reintento: el primer click puede caer antes de la hidratación de React (dev)
  try {
    await expect(checkoutLink).toBeVisible({ timeout: 3_000 });
  } catch {
    await page.getByRole("button", { name: "Agregar" }).first().click();
    await expect(checkoutLink).toBeVisible({ timeout: 10_000 });
  }
  await checkoutLink.click();
  await expect(page).toHaveURL(/\/checkout/);
}

// Flujo completo de compra por transferencia B2B (sin pasarela externa):
// agregar al carrito -> checkout -> orden persistida server-side -> success.
test("checkout con transferencia: agregar producto, pagar y ver confirmación", async ({ page }) => {
  await agregarYIrAlCheckout(page);

  // El carrito debe tener al menos 1 ítem en el resumen
  await expect(page.getByText("Resumen del pedido")).toBeVisible();

  // Completar datos de envío (inputs identificados por placeholder)
  await page.fill('input[placeholder="empresa@correo.cl"]', "comprador@starshop.cl");
  await page.fill('input[placeholder="76.123.456-7"]', "11.111.111-1");
  await page.fill('input[placeholder="Starshop SpA"]', "Comprador de Prueba");
  await page.fill('input[placeholder="+56 9 8765 4321"]', "+56 9 3747 9835");
  await page.fill('input[placeholder="Av. Matta 1234, Depto 5"]', "Av. Prueba 123, Depto 1");

  // Seleccionar comuna (el select de comuna contiene la opción placeholder)
  const comunaSelect = page.locator("select").filter({
    has: page.locator('option:text("Selecciona una comuna")'),
  });
  await comunaSelect.selectOption({ index: 1 });

  // Método de pago: transferencia (no requiere pasarela externa)
  await page.check('input[name="payment"][value="transferencia"]');

  // Enviar
  await page.getByRole("button", { name: /Pagar/ }).click();

  // Debe terminar en /checkout/success con una orden #ORD-XXXXX visible
  await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 20_000 });
  await expect(page.getByText(/ORD-\d{5}/).first()).toBeVisible();
  await expect(page.getByText("Volver a la tienda")).toBeVisible();
});

// La orden quedó registrada server-side (persistencia agregada en el fix de pagos)
test("la orden del checkout queda persistida en /api/orders", async ({ page, request }) => {
  await agregarYIrAlCheckout(page);
  await page.fill('input[placeholder="empresa@correo.cl"]', "persist@starshop.cl");
  await page.fill('input[placeholder="76.123.456-7"]', "11.111.111-1");
  await page.fill('input[placeholder="Starshop SpA"]', "Comprador Persistente");
  await page.fill('input[placeholder="+56 9 8765 4321"]', "+56 9 3747 9835");
  await page.fill('input[placeholder="Av. Matta 1234, Depto 5"]', "Av. Persistencia 99");
  const comunaSelect = page.locator("select").filter({
    has: page.locator('option:text("Selecciona una comuna")'),
  });
  await comunaSelect.selectOption({ index: 1 });
  await page.check('input[name="payment"][value="transferencia"]');
  await page.getByRole("button", { name: /Pagar/ }).click();
  await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 20_000 });

  // La API debe conocer al menos 1 orden
  const res = await request.get("/api/orders");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.total).toBeGreaterThanOrEqual(1);
});
