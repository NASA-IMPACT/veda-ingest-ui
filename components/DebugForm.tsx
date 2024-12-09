import { useState } from "react"

function DebugForm(){

  const [collection , setCollection] = useState('')

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    fetch('api/create-ingest', {
      method: 'POST',
      body: JSON.stringify({ collection: collection }),
      headers: { 'Content-Type': 'application/json' },
    })
      // .then(res => res.json())
      // .then(json => setCollecti(json.user))
  }

  return (
    <form onSubmit={submit}>
      <input
        type="text"
        name="Collection"
        value={collection}
        onChange={e => setCollection(e.target.value )}
      />

      <input type="submit" name="Sign Up" />
    </form>
  )
}

export default DebugForm;