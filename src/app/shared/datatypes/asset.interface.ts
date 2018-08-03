/**
 * Asset Types
 * - Interfaces for assets and metadata objects
 */

export interface MetadataRes {
    success: boolean
    total: number
    metadata: {
        SSID: string
        download_size: string
        fileProperties: any[]
        height: number
        width: number
        image_url: string
        metadata_json: any[]
        object_id: string
        object_type_id: number
        resolution_x: number
        resolution_y: number
        thumbnail_url: string
        title: string,
        updated_on: string,
        collections: any[],
        category_name: string,
        icc_profile_loc ?: any,
        contributinginstitutionid: number,
        category_id: string
    }[]
}