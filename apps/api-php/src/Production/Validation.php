<?php
declare(strict_types=1);
namespace KrishiGo\Production;

final class Validation
{
    public static function text(array $data, string $key, int $max, int $min = 1): string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value) || preg_match('//u', $value) !== 1) \kg_json(422, ['error' => 'invalid_' . $key]);
        $value = trim($value);
        if (strlen($value) < $min || strlen($value) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value)) {
            \kg_json(422, ['error' => 'invalid_' . $key]);
        }
        return $value;
    }
    public static function choice(array $data, string $key, array $allowed): string
    {
        $value = $data[$key] ?? null;
        if (!is_string($value) || !in_array($value, $allowed, true)) \kg_json(422, ['error' => 'invalid_' . $key]);
        return $value;
    }
    public static function number(array $data, string $key, float $minimum, float $maximum): string
    {
        $value = $data[$key] ?? null;
        if ((!is_string($value) && !is_int($value) && !is_float($value)) || !is_numeric($value) || !is_finite((float)$value)) \kg_json(422, ['error' => 'invalid_' . $key]);
        $number = (float)$value;
        if ($number < $minimum || $number > $maximum) \kg_json(422, ['error' => 'invalid_' . $key]);
        return number_format($number, 2, '.', '');
    }
    public static function email(array $data): string
    {
        $email = strtolower(self::text($data, 'email', 190, 5));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) \kg_json(422, ['error' => 'invalid_email']);
        return $email;
    }
}
