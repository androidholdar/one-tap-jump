using UnityEngine;

public class PlatformController : MonoBehaviour
{
    [Header("Movement Settings")]
    public float speed = 2f;
    public float range = 3f;

    private Vector3 startPos;

    void Start()
    {
        startPos = transform.position;
    }

    void Update()
    {
        // Smooth horizontal movement using PingPong to bounce between ranges
        float newX = startPos.x + Mathf.PingPong(Time.time * speed, range * 2) - range;
        transform.position = new Vector3(newX, transform.position.y, transform.position.z);
    }
}
