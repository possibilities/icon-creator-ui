import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const REPO_URL = 'https://github.com/tesseralis/polyhedra-viewer'
const TMP_DIR = '/tmp/polyhedra-viewer'
const DATA_PATH = 'src/data/polyhedra'

interface PolyhedronData {
  name: string
  vertices: number[][]
  faces: number[][]
}

async function ensureRepoCloned(): Promise<void> {
  try {
    await fs.access(TMP_DIR)
    console.log('Repository already exists at', TMP_DIR)
  } catch {
    console.log('Cloning repository to', TMP_DIR)
    execSync(`git clone ${REPO_URL} ${TMP_DIR}`, { stdio: 'inherit' })
  }
}

export async function getAllPolyhedronNames(): Promise<string[]> {
  await ensureRepoCloned()

  const polyhedraPath = path.join(TMP_DIR, DATA_PATH)
  const files = await fs.readdir(polyhedraPath)

  return files
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''))
}

export async function getPolyhedronData(
  name: string,
): Promise<PolyhedronData | null> {
  await ensureRepoCloned()

  const filePath = path.join(TMP_DIR, DATA_PATH, `${name}.json`)

  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as PolyhedronData
  } catch (error) {
    console.error(`Failed to read polyhedron data for ${name}:`, error)
    return null
  }
}
