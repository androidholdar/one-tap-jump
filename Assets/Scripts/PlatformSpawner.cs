using UnityEngine;

public class PlatformSpawner : MonoBehaviour
{
    public GameObject platformPrefab;
    public float spawnInterval = 3f;
    public float spawnXRange = 3f;
    public float spawnYOffset = 2f;

    private float lastSpawnY = 0f;

    void Start()
    {
        lastSpawnY = transform.position.y;
        // Initial spawn
        SpawnPlatform();
    }

    public void SpawnPlatform()
    {
        lastSpawnY += spawnYOffset;
        float randomX = Random.Range(-spawnXRange, spawnXRange);
        Vector3 spawnPos = new Vector3(randomX, lastSpawnY, 0);

        if (platformPrefab != null)
        {
            Instantiate(platformPrefab, spawnPos, Quaternion.identity);
        }
        else
        {
            Debug.LogWarning("PlatformSpawner: No platform prefab assigned. Simulating spawn at " + spawnPos);
        }
    }
}
