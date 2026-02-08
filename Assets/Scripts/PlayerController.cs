using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Jump Settings")]
    public float jumpForce = 10f;

    private Rigidbody2D rb;
    private GameManager gameManager;
    private bool isGrounded = true;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        gameManager = FindObjectOfType<GameManager>();

        if (rb == null) Debug.LogError("PlayerController requires a Rigidbody2D component.");
    }

    void Update()
    {
        // Jump on mouse click or screen tap (One Tap mechanic)
        if (Input.GetMouseButtonDown(0))
        {
            if (gameManager != null && gameManager.IsGameActive() && isGrounded)
            {
                Jump();
            }
        }
    }

    public void Jump()
    {
        isGrounded = false;
        // Detach from platform when jumping
        transform.SetParent(null);
        // Reset vertical velocity for consistent jump height and apply force
        rb.velocity = new Vector2(rb.velocity.x, jumpForce);
    }

    private void OnCollisionEnter2D(CollisionEnter2D collision)
    {
        // Check if we landed on a platform
        if (collision.gameObject.CompareTag("Platform"))
        {
            // Landing from above
            if (collision.relativeVelocity.y >= 0f)
            {
                isGrounded = true;
                // Stick to moving platform
                transform.SetParent(collision.transform);

                if (gameManager != null)
                {
                    gameManager.AddScore(1);
                }

                // Trigger next platform spawn
                PlatformSpawner spawner = FindObjectOfType<PlatformSpawner>();
                if (spawner != null)
                {
                    spawner.SpawnPlatform();
                }
            }
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        // Check if we fell into the death zone
        if (other.CompareTag("DeathZone"))
        {
            if (gameManager != null)
            {
                gameManager.GameOver();
            }
        }
    }
}
