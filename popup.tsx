import { useStorage } from "@plasmohq/storage/hook";



function IndexPopup() {
  const [expression, _setExpression, {
    setRenderValue: setExpressionRenderValue,
    setStoreValue: setExpressionStoreValue,
  }] = useStorage("expression");
  const [baseUrl, _setBaseUrl, {
    setRenderValue: setBaseUrlRenderValue,
    setStoreValue: setBaseUrlStoreValue,
  }] = useStorage("baseUrl");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        minHeight: 300,
        minWidth: 500,
      }}>
        <h1 style={{
          margin: 0,
        }}>Enhanced Temporal</h1>
      Base URL:
      <input onChange={(e) => setBaseUrlRenderValue(e.target.value)} value={baseUrl} />
      Expression:
      <textarea
        style={{
          flex: 1,
          resize: "none",
        }}
        onChange={(e) => setExpressionRenderValue(e.target.value)} value={expression} />
      <button onClick={() => {
        setExpressionStoreValue(expression);
        setBaseUrlStoreValue(baseUrl);
      }}>Save</button>
    </div>
  )
}

export default IndexPopup
