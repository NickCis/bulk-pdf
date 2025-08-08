export async function waitForSelector(
  selector: string,
  { tick = 200, timeout = 1000 } = {},
) {
  const start = Date.now();
  return await new Promise<void>((rs, rj) => {
    const check = () => {
      const el = document.querySelector(selector);
      if (el) {
        rs();
        return;
      }

      if (Date.now() - start > timeout) {
        rj();
        return;
      }

      setTimeout(check, tick);
    };

    check();
  });
}
